import ApplicationsManagement from '../models/ApplicationsManagement.js';
import { GroupCreate } from '../models/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all apps from group_create
export const getAllApps = async (req, res) => {
  try {
    const apps = await GroupCreate.findAll({
      attributes: ['id', 'name', 'apps_name'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: apps
    });
  } catch (error) {
    console.error('Error fetching apps:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch apps'
    });
  }
};

// Get all applications
export const getApplications = async (req, res) => {
  try {
    const applications = await ApplicationsManagement.findAll({
      include: [
        {
          model: GroupCreate,
          as: 'app',
          attributes: ['id', 'name', 'apps_name']
        }
      ],
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

// Create application
export const createApplication = async (req, res) => {
  try {
    const { app_id, title, content } = req.body;

    if (!app_id || !title) {
      return res.status(400).json({
        success: false,
        message: 'App and title are required'
      });
    }

    let file_path = null;
    if (req.file) {
      file_path = `/uploads/applications/${req.file.filename}`;
    }

    const application = await ApplicationsManagement.create({
      app_id,
      title,
      file_path,
      content
    });

    // Fetch created application with associations
    const createdApplication = await ApplicationsManagement.findByPk(application.id, {
      include: [
        {
          model: GroupCreate,
          as: 'app',
          attributes: ['id', 'name', 'apps_name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: createdApplication
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create application'
    });
  }
};

// Update application
export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { app_id, title, content } = req.body;

    const application = await ApplicationsManagement.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    let file_path = application.file_path;

    // If new file uploaded, delete old file and update path
    if (req.file) {
      if (application.file_path) {
        const oldFilePath = path.join(__dirname, '../../public', application.file_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      file_path = `/uploads/applications/${req.file.filename}`;
    }

    await application.update({
      app_id,
      title,
      file_path,
      content
    });

    // Fetch updated application with associations
    const updatedApplication = await ApplicationsManagement.findByPk(id, {
      include: [
        {
          model: GroupCreate,
          as: 'app',
          attributes: ['id', 'name', 'apps_name']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application'
    });
  }
};

// Delete application
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await ApplicationsManagement.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Delete file if exists
    if (application.file_path) {
      const filePath = path.join(__dirname, '../../public', application.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await application.destroy();

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application'
    });
  }
};

