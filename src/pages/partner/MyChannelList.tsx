import React, { useState, useEffect } from 'react';
import { Search, Tv, X, Eye, EyeOff, Key, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

interface MediaChannel {
  id: number;
  media_logo: string | null;
  media_name_english: string;
  media_name_regional: string | null;
  followers: number;
  ratings: number;
  earnings: number;
  status: string;
  hasPasscode: boolean;
  passcodeStatus: boolean;
  isActive: boolean;
}

export const MyChannelList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<MediaChannel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<MediaChannel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Passcode Modal States
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<MediaChannel | null>(null);
  const [passcodeMode, setPasscodeMode] = useState<'enter' | 'set' | 'change' | 'forgot' | 'otp'>('enter');
  const [passcode, setPasscode] = useState(['', '', '', '']);
  const [newPasscode, setNewPasscode] = useState(['', '', '', '']);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');
  const [passcodeSuccess, setPasscodeSuccess] = useState('');
  const [passcodeLoading, setPasscodeLoading] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);

  useEffect(() => {
    fetchChannelList();
  }, []);

  useEffect(() => {
    filterChannelList();
  }, [searchTerm, channels]);

  const fetchChannelList = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/partner/my-channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setChannels(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch channel list');
    } finally {
      setLoading(false);
    }
  };

  const filterChannelList = () => {
    let filtered = channels;

    if (searchTerm) {
      filtered = filtered.filter(channel =>
        channel.media_name_english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (channel.media_name_regional && channel.media_name_regional.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredChannels(filtered);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/partner/my-channels/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setChannels(channels.filter(channel => channel.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete channel');
    }
  };

  const handleViewClick = async (channel: MediaChannel) => {
    if (channel.status !== 'active') return;
    // If passcode not set OR passcode status is OFF, go directly to dashboard
    if (!channel.hasPasscode || !channel.passcodeStatus) {
      navigate(`/media/dashboard/${channel.id}`);
      return;
    }
    // Passcode is set and status is ON, show passcode modal
    setSelectedChannel(channel);
    setPasscode(['', '', '', '']);
    setNewPasscode(['', '', '', '']);
    setOtp(['', '', '', '', '', '']);
    setPasscodeError('');
    setPasscodeSuccess('');
    setPasscodeMode('enter');
    setShowPasscodeModal(true);
  };

  const handlePasscodeToggle = async (channel: MediaChannel) => {
    // If passcode not set, show set passcode modal first
    if (!channel.hasPasscode) {
      setSelectedChannel(channel);
      setPasscode(['', '', '', '']);
      setNewPasscode(['', '', '', '']);
      setOtp(['', '', '', '', '', '']);
      setPasscodeError('');
      setPasscodeSuccess('');
      setPasscodeMode('set');
      setShowPasscodeModal(true);
      return;
    }

    // Toggle passcode status
    setTogglingStatus(channel.id);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/partner/channel/${channel.id}/toggle-passcode-status`,
        { status: !channel.passcodeStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setChannels(channels.map(c =>
          c.id === channel.id ? { ...c, passcodeStatus: !c.passcodeStatus } : c
        ));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle passcode status');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleStatusToggle = async (channel: MediaChannel) => {
    setTogglingStatus(channel.id);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/partner/channel/${channel.id}/toggle-status`,
        { status: !channel.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setChannels(channels.map(c =>
          c.id === channel.id ? { ...c, isActive: !c.isActive } : c
        ));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle status');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handlePasscodeChange = (index: number, value: string, type: 'current' | 'new' | 'otp' = 'current') => {
    if (!/^\d*$/.test(value)) return;
    const maxIndex = type === 'otp' ? 5 : 3;

    if (type === 'otp') {
      const arr = [...otp];
      arr[index] = value.slice(-1);
      setOtp(arr);
    } else if (type === 'new') {
      const arr = [...newPasscode];
      arr[index] = value.slice(-1);
      setNewPasscode(arr);
    } else {
      const arr = [...passcode];
      arr[index] = value.slice(-1);
      setPasscode(arr);
    }

    if (value && index < maxIndex) {
      const prefix = type === 'otp' ? 'otp' : (type === 'new' ? 'new-passcode' : 'passcode');
      const nextInput = document.getElementById(`${prefix}-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePasscodeKeyDown = (index: number, e: React.KeyboardEvent, type: 'current' | 'new' | 'otp' = 'current') => {
    const arr = type === 'otp' ? otp : (type === 'new' ? newPasscode : passcode);
    if (e.key === 'Backspace' && !arr[index] && index > 0) {
      const prefix = type === 'otp' ? 'otp' : (type === 'new' ? 'new-passcode' : 'passcode');
      const prevInput = document.getElementById(`${prefix}-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSetPasscode = async () => {
    if (!selectedChannel) return;
    const code = passcode.join('');
    if (code.length !== 4) {
      setPasscodeError('Please enter 4-digit passcode');
      return;
    }

    setPasscodeLoading(true);
    setPasscodeError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/partner/channel/${selectedChannel.id}/set-passcode`,
        { passcode: code },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPasscodeSuccess('Passcode set successfully!');
        setChannels(channels.map(c =>
          c.id === selectedChannel.id ? { ...c, hasPasscode: true, passcodeStatus: true } : c
        ));
        setTimeout(() => {
          setShowPasscodeModal(false);
          setPasscodeSuccess('');
        }, 1500);
      }
    } catch (err: any) {
      setPasscodeError(err.response?.data?.message || 'Failed to set passcode');
    } finally {
      setPasscodeLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!selectedChannel) return;
    setPasscodeLoading(true);
    setPasscodeError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/partner/channel/${selectedChannel.id}/send-change-otp`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPasscodeSuccess('OTP sent to your email!');
        setPasscodeMode('otp');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => setPasscodeSuccess(''), 2000);
      }
    } catch (err: any) {
      setPasscodeError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setPasscodeLoading(false);
    }
  };

  const handleVerifyOtpAndChange = async () => {
    if (!selectedChannel) return;
    const otpCode = otp.join('');
    const newCode = newPasscode.join('');

    if (otpCode.length !== 6) {
      setPasscodeError('Please enter 6-digit OTP');
      return;
    }
    if (newCode.length !== 4) {
      setPasscodeError('Please enter 4-digit new passcode');
      return;
    }

    setPasscodeLoading(true);
    setPasscodeError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/partner/channel/${selectedChannel.id}/verify-otp-change-passcode`,
        { otp: otpCode, newPasscode: newCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPasscodeSuccess('Passcode changed successfully!');
        setTimeout(() => {
          setShowPasscodeModal(false);
          setPasscodeSuccess('');
        }, 1500);
      }
    } catch (err: any) {
      setPasscodeError(err.response?.data?.message || 'Failed to change passcode');
    } finally {
      setPasscodeLoading(false);
    }
  };

  // Keep for backward compatibility
  const handleGeneratePasscode = handleSetPasscode;

  const handleVerifyPasscode = async () => {
    if (!selectedChannel) return;
    const code = passcode.join('');
    if (code.length !== 4) {
      setPasscodeError('Please enter 4-digit passcode');
      return;
    }

    setPasscodeLoading(true);
    setPasscodeError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/partner/channel/${selectedChannel.id}/verify-passcode`,
        { passcode: code },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowPasscodeModal(false);
        navigate(`/media/dashboard/${selectedChannel.id}`);
      }
    } catch (err: any) {
      setPasscodeError(err.response?.data?.message || 'Invalid passcode');
    } finally {
      setPasscodeLoading(false);
    }
  };

  // Remove old change passcode (now uses OTP flow)
  const handleChangePasscode = handleSendOtp;

  const handleForgotPasscode = async () => {
    if (!selectedChannel) return;
    setPasscodeLoading(true);
    setPasscodeError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/partner/channel/${selectedChannel.id}/forgot-passcode`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPasscodeSuccess('New passcode has been sent to your email!');
        setTimeout(() => {
          setShowPasscodeModal(false);
          setPasscodeSuccess('');
        }, 2000);
      }
    } catch (err: any) {
      setPasscodeError(err.response?.data?.message || 'Failed to send passcode');
    } finally {
      setPasscodeLoading(false);
    }
  };

  const renderPasscodeInputs = (type: 'current' | 'new' | 'otp' = 'current') => {
    const arr = type === 'otp' ? otp : (type === 'new' ? newPasscode : passcode);
    const prefix = type === 'otp' ? 'otp' : (type === 'new' ? 'new-passcode' : 'passcode');

    return (
      <div className="flex justify-center gap-2">
        {arr.map((digit, index) => (
          <input
            key={index}
            id={`${prefix}-${index}`}
            type={showPasscode ? 'text' : 'password'}
            value={digit}
            onChange={(e) => handlePasscodeChange(index, e.target.value, type)}
            onKeyDown={(e) => handlePasscodeKeyDown(index, e, type)}
            maxLength={1}
            className={`${type === 'otp' ? 'w-10 h-12' : 'w-12 h-14'} text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none`}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Channel List</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search channels..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Channel List Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Loading channels...</p>
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <Tv className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No channels found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search' : 'Start by creating your first media channel'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media Name</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Followers</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ratings</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Passcode</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredChannels.map((channel, index) => (
                  <tr key={channel.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {channel.media_logo ? (
                          <img
                            src={`${BACKEND_URL}${channel.media_logo}`}
                            alt={channel.media_name_english}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Tv className="text-gray-400" size={24} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{channel.media_name_english}</div>
                        {channel.media_name_regional && (
                          <div className="text-sm text-gray-500">{channel.media_name_regional}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {channel.followers?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {channel.ratings?.toFixed(1) || '0.0'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      ₹{channel.earnings?.toLocaleString() || 0}
                    </td>
                    {/* Passcode Toggle */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handlePasscodeToggle(channel)}
                        disabled={togglingStatus === channel.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          channel.hasPasscode && channel.passcodeStatus ? 'bg-primary-600' : 'bg-gray-300'
                        } ${togglingStatus === channel.id ? 'opacity-50' : ''}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          channel.hasPasscode && channel.passcodeStatus ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                      {!channel.hasPasscode && (
                        <div className="text-xs text-gray-400 mt-1">Not Set</div>
                      )}
                    </td>
                    {/* Status Toggle */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleStatusToggle(channel)}
                        disabled={togglingStatus === channel.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          channel.isActive ? 'bg-green-500' : 'bg-gray-300'
                        } ${togglingStatus === channel.id ? 'opacity-50' : ''}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          channel.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                      <div className={`text-xs mt-1 ${channel.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {channel.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {channel.status === 'active' ? (
                        <button
                          onClick={() => handleViewClick(channel)}
                          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500" title={`Status: ${channel.status}. View available after admin approval.`}>
                          Pending approval
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Passcode Modal */}
      {showPasscodeModal && selectedChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary-50">
              <h3 className="text-lg font-semibold text-gray-900">
                {passcodeMode === 'set' && 'Set Passcode'}
                {passcodeMode === 'enter' && 'Enter Passcode'}
                {passcodeMode === 'change' && 'Change Passcode'}
                {passcodeMode === 'otp' && 'Verify OTP'}
                {passcodeMode === 'forgot' && 'Forgot Passcode'}
              </h3>
              <button
                onClick={() => setShowPasscodeModal(false)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-center text-gray-600 mb-4">{selectedChannel.media_name_english}</p>

              {passcodeError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                  {passcodeError}
                </div>
              )}

              {passcodeSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
                  {passcodeSuccess}
                </div>
              )}

              {passcodeMode === 'set' && (
                <div>
                  <Key className="mx-auto text-primary-500 mb-4" size={48} />
                  <p className="text-center text-gray-600 mb-4">Enter a 4-digit passcode to secure your channel</p>
                  {renderPasscodeInputs('current')}
                  <div className="flex items-center justify-center mt-3">
                    <button
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                      {showPasscode ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <button
                    onClick={handleSetPasscode}
                    disabled={passcodeLoading || passcode.join('').length !== 4}
                    className="w-full mt-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {passcodeLoading ? 'Setting...' : 'Set Passcode'}
                  </button>
                </div>
              )}

              {passcodeMode === 'enter' && (
                <div>
                  <p className="text-center text-gray-600 mb-4">Enter your 4-digit passcode</p>
                  {renderPasscodeInputs('current')}
                  <div className="flex items-center justify-center mt-3">
                    <button
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                      {showPasscode ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <button
                    onClick={handleVerifyPasscode}
                    disabled={passcodeLoading || passcode.join('').length !== 4}
                    className="w-full mt-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {passcodeLoading ? 'Verifying...' : 'Continue'}
                  </button>
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => { setPasscodeMode('forgot'); setPasscodeError(''); }}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <Mail size={14} /> Forgot Passcode
                    </button>
                    <button
                      onClick={() => { setPasscodeMode('change'); setPasscode(['', '', '', '']); setPasscodeError(''); }}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <Lock size={14} /> Change Passcode
                    </button>
                  </div>
                </div>
              )}

              {passcodeMode === 'change' && (
                <div className="text-center">
                  <Lock className="mx-auto text-primary-500 mb-4" size={48} />
                  <p className="text-gray-600 mb-6">To change your passcode, we'll send an OTP to your registered email.</p>
                  <button
                    onClick={handleSendOtp}
                    disabled={passcodeLoading}
                    className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {passcodeLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                  <button
                    onClick={() => { setPasscodeMode('enter'); setPasscode(['', '', '', '']); setNewPasscode(['', '', '', '']); setPasscodeError(''); }}
                    className="w-full mt-2 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Back
                  </button>
                </div>
              )}

              {passcodeMode === 'otp' && (
                <div>
                  <p className="text-center text-gray-600 mb-4">Enter the 6-digit OTP sent to your email</p>
                  {renderPasscodeInputs('otp')}
                  <p className="text-center text-gray-600 mt-6 mb-3">Enter New Passcode (4 digits)</p>
                  {renderPasscodeInputs('new')}
                  <div className="flex items-center justify-center mt-3">
                    <button
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                      {showPasscode ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <button
                    onClick={handleVerifyOtpAndChange}
                    disabled={passcodeLoading || otp.join('').length !== 6 || newPasscode.join('').length !== 4}
                    className="w-full mt-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {passcodeLoading ? 'Verifying...' : 'Change Passcode'}
                  </button>
                  <button
                    onClick={() => { setPasscodeMode('change'); setOtp(['', '', '', '', '', '']); setNewPasscode(['', '', '', '']); setPasscodeError(''); }}
                    className="w-full mt-2 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Back
                  </button>
                </div>
              )}

              {passcodeMode === 'forgot' && (
                <div className="text-center">
                  <Mail className="mx-auto text-primary-500 mb-4" size={48} />
                  <p className="text-gray-600 mb-6">We'll send a new passcode to your registered email address.</p>
                  <button
                    onClick={handleForgotPasscode}
                    disabled={passcodeLoading}
                    className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {passcodeLoading ? 'Sending...' : 'Send New Passcode'}
                  </button>
                  <button
                    onClick={() => { setPasscodeMode('enter'); setPasscodeError(''); }}
                    className="w-full mt-2 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
