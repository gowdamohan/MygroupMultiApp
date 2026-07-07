import { UserEnquiry } from '../models/index.js';

/** POST /api/v1/enquiry — public submit */
export const submitEnquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message, group_name } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required',
      });
    }

    const enquiry = await UserEnquiry.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      subject: subject?.trim() || null,
      message: message.trim(),
      group_name: group_name || 'corporate',
      status: 'new',
    });

    res.status(201).json({
      success: true,
      message: 'Your enquiry has been submitted successfully',
      data: { id: enquiry.id },
    });
  } catch (error) {
    console.error('Error submitting enquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit enquiry',
      error: error.message,
    });
  }
};

/** GET /api/v1/enquiry — corporate admin list */
export const getEnquiries = async (req, res) => {
  try {
    const { group_name, status } = req.query;
    const where = {};
    if (group_name) where.group_name = group_name;
    if (status) where.status = status;

    const enquiries = await UserEnquiry.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: enquiries, count: enquiries.length });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enquiries',
      error: error.message,
    });
  }
};

/** PATCH /api/v1/enquiry/:id/status — update status */
export const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['new', 'read', 'replied', 'closed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const enquiry = await UserEnquiry.findByPk(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    await enquiry.update({ status });
    res.json({ success: true, message: 'Status updated', data: enquiry });
  } catch (error) {
    console.error('Error updating enquiry status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update enquiry',
      error: error.message,
    });
  }
};

/** DELETE /api/v1/enquiry/:id */
export const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await UserEnquiry.findByPk(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    await enquiry.destroy();
    res.json({ success: true, message: 'Enquiry deleted' });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete enquiry',
      error: error.message,
    });
  }
};
