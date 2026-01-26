import { FooterPage } from '../models/index.js';

/**
 * Get testimonials from footer_page table where footer_page_type = 'testimonials'
 * Maps: title→name, tag_line→designation, content→message
 */
export const getTestimonials = async (req, res) => {
  try {
    const rows = await FooterPage.findAll({
      where: { footer_page_type: 'testimonials' },
      order: [['id', 'DESC']]
    });

    const data = rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.title,
      designation: row.tag_line,
      image: row.image,
      message: row.content
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching testimonials',
      error: error.message
    });
  }
};
