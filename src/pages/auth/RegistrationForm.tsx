import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const steps = [
  { id: 1, label: 'Account Info' },
  { id: 2, label: 'Personal Info' },
  { id: 3, label: 'Location' },
  { id: 4, label: 'Professional' },
  { id: 5, label: 'Review' }
];

const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France'];
const states = ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Pennsylvania'];
const educationLevels = ['High School', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other'];
const professions = ['Software Engineer', 'Designer', 'Manager', 'Teacher', 'Doctor', 'Engineer', 'Other'];

export const RegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { groupName = 'default' } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', phone: '', displayName: '', gender: '', dob: '',
    country: '', state: '', district: '',
    education: '', profession: ''
  });

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate(`/client-login/${groupName}`);
    }, 2000);
  };

  const renderInput = (label: string, name: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block mb-2 text-sm text-gray-700">{label} <span className="text-red-500">*</span></label>
      <input
        type={type}
        placeholder={placeholder}
        value={formData[name as keyof typeof formData]}
        onChange={(e) => updateField(name, e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        required
      />
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
            {renderInput('Username', 'username', 'text', 'Choose a username')}
            {renderInput('Email Address', 'email', 'email', 'your.email@example.com')}
            {renderInput('Password', 'password', 'password', 'Create a strong password')}
            {renderInput('Confirm Password', 'confirmPassword', 'password', 'Re-enter your password')}
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput('First Name', 'firstName', 'text', 'John')}
              {renderInput('Last Name', 'lastName', 'text', 'Doe')}
            </div>
            {renderInput('Phone Number', 'phone', 'tel', '+1 (555) 000-0000')}
            {renderInput('Display Name', 'displayName', 'text', 'How should we call you?')}
            <div>
              <label className="block mb-2 text-sm text-gray-700">Gender</label>
              <div className="flex gap-6">
                {['Male', 'Female', 'Other'].map((gender) => (
                  <label key={gender} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={(e) => updateField('gender', e.target.value)}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">{gender}</span>
                  </label>
                ))}
              </div>
            </div>
            {renderInput('Date of Birth', 'dob', 'date')}
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm text-gray-700">Country <span className="text-red-500">*</span></label>
              <select
                value={formData.country}
                onChange={(e) => updateField('country', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                required
              >
                <option value="">Select a country</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm text-gray-700">State <span className="text-red-500">*</span></label>
              <select
                value={formData.state}
                onChange={(e) => updateField('state', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all disabled:bg-gray-100"
                required
                disabled={!formData.country}
              >
                <option value="">Select a state</option>
                {states.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {renderInput('District / City', 'district', 'text', 'Enter your district or city')}
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm text-gray-700">Education Level <span className="text-red-500">*</span></label>
              <select
                value={formData.education}
                onChange={(e) => updateField('education', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                required
              >
                <option value="">Select education level</option>
                {educationLevels.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm text-gray-700">Profession <span className="text-red-500">*</span></label>
              <select
                value={formData.profession}
                onChange={(e) => updateField('profession', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                required
              >
                <option value="">Select profession</option>
                {professions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div key="step5" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                <Check className="text-white" size={32} />
              </div>
              <h3 className="text-gray-900 mb-2">Review Your Information</h3>
              <p className="text-gray-600 text-sm">Please verify all details before submitting</p>
            </div>

            <div className="space-y-4">
              {[
                { title: 'Account Information', data: { Username: formData.username, Email: formData.email } },
                { title: 'Personal Information', data: { Name: `${formData.firstName} ${formData.lastName}`, Phone: formData.phone, Gender: formData.gender, 'Date of Birth': formData.dob } },
                { title: 'Location', data: { Country: formData.country, State: formData.state, District: formData.district } },
                { title: 'Professional', data: { Education: formData.education, Profession: formData.profession } }
              ].map((section, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-6">
                  <h5 className="text-gray-900 mb-3 text-sm">{section.title}</h5>
                  <div className="space-y-2">
                    {Object.entries(section.data).map(([key, value]) => (
                      <p key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{key}:</span>
                        <span className="text-gray-900">{value}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(`/client-login/${groupName}`)} className="flex items-center gap-2 mb-8 text-gray-600 hover:text-gray-900 transition-colors group">
          <ArrowLeft size={20} className="transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Login</span>
        </button>

        <div className="text-center mb-12">
          <h2 className="text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-gray-600">Join {groupName} community today</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {steps.map((step) => (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex-1 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all ${currentStep >= step.id ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {currentStep > step.id ? <Check size={20} /> : step.id}
                  </div>
                  <span className={`text-xs mt-2 ${currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'}`}>{step.label}</span>
                </div>
                {step.id < steps.length && (
                  <div className={`flex-1 h-0.5 mb-6 ${currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {renderStep()}
              </AnimatePresence>
            </div>

            <div className="flex gap-4 mt-10 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowLeft size={20} />
                <span>Previous</span>
              </button>

              <div className="flex-1" />

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all flex items-center gap-2"
                >
                  <span>Next Step</span>
                  <ArrowRight size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <Check size={20} />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <button onClick={() => navigate(`/client-login/${groupName}`)} className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
