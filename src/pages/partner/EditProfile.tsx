import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PartnerProfileCompletionForm } from '../../components/PartnerProfileCompletionForm';
import { API_BASE_URL } from '../../config/api.config';

interface EditProfileProps {
  registrationStatus?: string;
  onStatusChange?: (newStatus: string) => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({
  registrationStatus: registrationStatusProp,
  onStatusChange: onStatusChangeProp
}) => {
  const [registrationStatus, setRegistrationStatus] = useState(registrationStatusProp || 'pending');

  const fetchRegistrationStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/partner/user-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.data.registration_status) {
        setRegistrationStatus(response.data.data.registration_status);
      }
    } catch (err) {
      console.error('Error fetching registration status:', err);
    }
  }, []);

  useEffect(() => {
    if (registrationStatusProp) {
      setRegistrationStatus(registrationStatusProp);
    } else {
      fetchRegistrationStatus();
    }
  }, [registrationStatusProp, fetchRegistrationStatus]);

  const handleStatusChange = (newStatus: string) => {
    setRegistrationStatus(newStatus);
    onStatusChangeProp?.(newStatus);
  };

  return (
    <PartnerProfileCompletionForm
      variant="edit"
      registrationStatus={registrationStatus}
      onStatusChange={handleStatusChange}
    />
  );
};
