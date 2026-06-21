import { OwnerDetails, ClientRegistration, User } from '../models/index.js';
import { uploadFile, deleteFile, getSignedReadUrl } from '../services/wasabiService.js';
import { buildRegistrationFormSummary } from '../utils/resolveCustomFormData.js';

const buildOwnerDetailsResponse = async (user, clientReg, ownerData) => {
  const userRecord = await User.findByPk(user.id, {
    attributes: ['email', 'username', 'identification_code', 'created_on']
  });

  const { resolved_form_data, registration_fields } = await buildRegistrationFormSummary(
    user.group_id,
    clientReg.custom_form_data
  );

  return {
    success: true,
    data: ownerData,
    registration_status: clientReg.status,
    registration_date: clientReg.created_at,
    registration_fields,
    resolved_form_data,
    custom_form_data: clientReg.custom_form_data,
    user: userRecord
      ? {
          email: userRecord.email,
          username: userRecord.username,
          identification_code: userRecord.identification_code,
          created_on: userRecord.created_on
        }
      : null
  };
};

/**
 * Get owner details for the logged-in partner
 * GET /api/v1/partner/owner-details
 */
export const getOwnerDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, { attributes: ['id', 'group_id'] });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const clientReg = await ClientRegistration.findOne({
      where: { user_id: userId, group_id: user.group_id }
    });
    if (!clientReg) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    let ownerDetails = await OwnerDetails.findOne({
      where: { user_id: userId, registration_id: clientReg.id }
    });

    // Generate signed URLs for file fields
    if (ownerDetails) {
      const data = ownerDetails.toJSON();
      const fileFields = ['photo_path', 'logo_path', 'id_proof_path', 'address_proof_path'];
      for (const field of fileFields) {
        if (data[field]) {
          try {
            const result = await getSignedReadUrl(data[field]);
            data[field.replace('_path', '_signed_url')] = result.signedUrl;
          } catch (e) { /* ignore */ }
        }
      }
      // Sign other_documents
      if (data.other_documents && Array.isArray(data.other_documents)) {
        for (let i = 0; i < data.other_documents.length; i++) {
          if (data.other_documents[i].path) {
            try {
              const result = await getSignedReadUrl(data.other_documents[i].path);
              data.other_documents[i].signed_url = result.signedUrl;
            } catch (e) { /* ignore */ }
          }
        }
      }
      // Sign company docs
      for (const docField of ['company_registration_docs', 'company_taxation_docs']) {
        if (data[docField] && Array.isArray(data[docField])) {
          for (let i = 0; i < data[docField].length; i++) {
            if (data[docField][i].path) {
              try {
                const result = await getSignedReadUrl(data[docField][i].path);
                data[docField][i].signed_url = result.signedUrl;
              } catch (e) { /* ignore */ }
            }
          }
        }
      }
      return res.json(await buildOwnerDetailsResponse(user, clientReg, data));
    }

    return res.json(await buildOwnerDetailsResponse(user, clientReg, null));
  } catch (error) {
    console.error('Error fetching owner details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch owner details' });
  }
};

const parseDocArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const OWNER_TEXT_FIELDS = [
  'name', 'father_name', 'mother_name', 'mobile_no', 'email_id',
  'address', 'dob', 'nationality', 'gender', 'marital_status',
  'education', 'other_details'
];

const COMPANY_TEXT_FIELDS = [
  'display_name', 'company_name', 'company_registration', 'company_taxation'
];

const OWNER_SINGLE_FILE_FIELDS = [
  { field: 'photo', pathKey: 'photo_path', urlKey: 'photo_url' },
  { field: 'id_proof', pathKey: 'id_proof_path', urlKey: 'id_proof_url' },
  { field: 'address_proof', pathKey: 'address_proof_path', urlKey: 'address_proof_url' }
];

const COMPANY_SINGLE_FILE_FIELDS = [
  { field: 'logo', pathKey: 'logo_path', urlKey: 'logo_url' }
];

const OWNER_MULTI_FILE_FIELDS = [
  { field: 'other_documents', key: 'other_documents' }
];

const COMPANY_MULTI_FILE_FIELDS = [
  { field: 'company_registration_docs', key: 'company_registration_docs' },
  { field: 'company_taxation_docs', key: 'company_taxation_docs' }
];

const applyTextFields = (updates, body, fields) => {
  for (const key of fields) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      updates[key] = key === 'dob' ? (body[key] || null) : (body[key] ?? '');
    }
  }
};

/**
 * Save/Update owner details for the logged-in partner
 * POST /api/v1/partner/owner-details
 */
export const saveOwnerDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, { attributes: ['id', 'group_id'] });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const clientReg = await ClientRegistration.findOne({
      where: { user_id: userId, group_id: user.group_id }
    });
    if (!clientReg) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    // If already submitted/verified/processed, don't allow edit
    if (['verified', 'processed_for_approve'].includes(clientReg.status)) {
      return res.status(400).json({ success: false, message: 'Profile already under review, cannot modify' });
    }

    const section = req.body.section;
    const submitForVerification = req.body.submit_for_verification === 'true';
    const folder = `owner_details/user_${userId}`;

    // Find or create owner details
    let ownerDetails = await OwnerDetails.findOne({
      where: { user_id: userId, registration_id: clientReg.id }
    });

    const existingData = ownerDetails ? ownerDetails.toJSON() : null;
    const updates = { updated_at: new Date() };

    if (section === 'owner') {
      applyTextFields(updates, req.body, OWNER_TEXT_FIELDS);
    } else if (section === 'company') {
      applyTextFields(updates, req.body, COMPANY_TEXT_FIELDS);
    } else {
      applyTextFields(updates, req.body, [...OWNER_TEXT_FIELDS, ...COMPANY_TEXT_FIELDS]);
    }

    const files = req.files || {};

    const singleFileFields = section === 'owner'
      ? OWNER_SINGLE_FILE_FIELDS
      : section === 'company'
        ? COMPANY_SINGLE_FILE_FIELDS
        : [...OWNER_SINGLE_FILE_FIELDS, ...COMPANY_SINGLE_FILE_FIELDS];

    for (const { field, pathKey, urlKey } of singleFileFields) {
      if (files[field] && files[field][0]) {
        if (existingData?.[pathKey]) {
          try { await deleteFile(existingData[pathKey]); } catch (e) { /* ignore old-file delete errors */ }
        }
        const f = files[field][0];
        try {
          const result = await uploadFile(f.buffer, f.originalname, f.mimetype, folder);
          if (result.success) {
            updates[pathKey] = result.fileName;
            updates[urlKey] = result.publicUrl;
          }
        } catch (uploadErr) {
          console.error(`Wasabi upload failed for field "${field}":`, uploadErr?.message || uploadErr);
          return res.status(500).json({
            success: false,
            message: `File upload failed for ${field}. Please try again.`
          });
        }
      }
    }

    const multiFileFields = section === 'owner'
      ? OWNER_MULTI_FILE_FIELDS
      : section === 'company'
        ? COMPANY_MULTI_FILE_FIELDS
        : [...OWNER_MULTI_FILE_FIELDS, ...COMPANY_MULTI_FILE_FIELDS];

    for (const { field, key } of multiFileFields) {
      if (files[field] && files[field].length > 0) {
        const existingDocs = parseDocArray(existingData?.[key]);
        const newDocs = [...existingDocs];
        for (const f of files[field]) {
          try {
            const result = await uploadFile(f.buffer, f.originalname, f.mimetype, folder);
            if (result.success) {
              newDocs.push({
                name: f.originalname,
                path: result.fileName,
                url: result.publicUrl,
                uploaded_at: new Date().toISOString()
              });
            }
          } catch (uploadErr) {
            console.error(`Wasabi upload failed for multi-file field "${field}" (${f.originalname}):`, uploadErr?.message || uploadErr);
            return res.status(500).json({
              success: false,
              message: `File upload failed for ${f.originalname}. Please try again.`
            });
          }
        }
        updates[key] = newDocs;
      }
    }

    const shouldMarkSubmitted = submitForVerification && clientReg.status === 'pending';

    if (shouldMarkSubmitted) {
      updates.status = 'submitted';
    } else if (!ownerDetails) {
      updates.status = 'draft';
    }

    if (ownerDetails) {
      await ownerDetails.update(updates);
      await ownerDetails.reload();
    } else {
      ownerDetails = await OwnerDetails.create({
        user_id: userId,
        registration_id: clientReg.id,
        ...updates
      });
    }

    if (shouldMarkSubmitted) {
      await clientReg.update({ status: 'submitted', updated_at: new Date() });
      await clientReg.reload();
    }

    res.json({
      success: true,
      message: 'Owner details saved successfully',
      data: ownerDetails,
      registration_status: clientReg.status
    });
  } catch (error) {
    console.error('Error saving owner details:', error);
    res.status(500).json({ success: false, message: 'Failed to save owner details' });
  }
};

/**
 * Delete a document from owner details (other_documents, company_registration_docs, company_taxation_docs)
 * DELETE /api/v1/partner/owner-details/document
 */
export const deleteOwnerDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doc_field, doc_path } = req.body;

    if (!doc_field || !doc_path) {
      return res.status(400).json({ success: false, message: 'doc_field and doc_path are required' });
    }

    const ownerDetails = await OwnerDetails.findOne({ where: { user_id: userId } });
    if (!ownerDetails) {
      return res.status(404).json({ success: false, message: 'Owner details not found' });
    }

    const validFields = ['other_documents', 'company_registration_docs', 'company_taxation_docs'];
    if (!validFields.includes(doc_field)) {
      return res.status(400).json({ success: false, message: 'Invalid document field' });
    }

    const docs = parseDocArray(ownerDetails[doc_field]);
    const updatedDocs = docs.filter(d => d.path !== doc_path);

    // Delete from Wasabi
    try { await deleteFile(doc_path); } catch (e) { /* ignore */ }

    await ownerDetails.update({ [doc_field]: updatedDocs });

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};

