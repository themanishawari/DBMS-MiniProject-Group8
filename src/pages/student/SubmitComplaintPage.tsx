import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  FilePlus2,
  Info,
  Paperclip,
  Shield,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { CAMPUS_LOCATIONS, PRIORITY_CONFIG } from '../../data/constants';
import { useAuth } from '../../context/AuthContext';
import { complaintRepository } from '../../repositories';
import { ComplaintService } from '../../services/ComplaintService';
import { Attachment, Complaint, ComplaintCategory, ComplaintPriority, Department } from '../../types';

export const SubmitComplaintPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('medium');
  const [campusArea, setCampusArea] = useState(CAMPUS_LOCATIONS[0].area);
  const [building, setBuilding] = useState(CAMPUS_LOCATIONS[0].buildings[0]);
  const [floor, setFloor] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [preferredContact, setPreferredContact] = useState<'portal' | 'email' | 'phone'>('portal');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSensitive, setIsSensitive] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      const [cats, depts] = await Promise.all([
        complaintRepository.getCategories(),
        complaintRepository.getDepartments(),
      ]);
      const activeCats = cats.filter((c) => c.isActive);
      setCategories(activeCats);
      setDepartments(depts.filter((d) => d.isActive));

      if (activeCats.length > 0) {
        setSelectedCategoryId(activeCats[0].id);
        setSelectedDepartmentId(activeCats[0].defaultDepartmentId);
        if (activeCats[0].subcategories.length > 0) {
          setSelectedSubcategoryId(activeCats[0].subcategories[0].id);
        }
        setIsSensitive(activeCats[0].isSensitive);
      }
    };
    loadMetadata();
  }, []);

  const currentCategory = categories.find((c) => c.id === selectedCategoryId);

  // When category changes, auto-select its default department and default subcategory
  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      setSelectedDepartmentId(cat.defaultDepartmentId);
      if (cat.subcategories.length > 0) {
        setSelectedSubcategoryId(cat.subcategories[0].id);
      } else {
        setSelectedSubcategoryId('');
      }
      setIsSensitive(cat.isSensitive);
    }
  };

  const handleAreaChange = (area: string) => {
    setCampusArea(area);
    const loc = CAMPUS_LOCATIONS.find((l) => l.area === area);
    if (loc && loc.buildings.length > 0) {
      setBuilding(loc.buildings[0]);
    }
  };

  // Mock File Upload Handler with File size & type validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    if (file.size > maxSizeBytes) {
      alert('File size exceeds the 5 MB limit. Please attach a compressed image or PDF.');
      return;
    }

    const newAtt: Attachment = {
      id: `att-${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
    };

    setAttachments((prev) => [...prev, newAtt]);
    e.target.value = ''; // Reset input
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission

    const validation = ComplaintService.validateComplaintSubmission({
      title,
      description,
      categoryId: selectedCategoryId,
      subcategoryId: selectedSubcategoryId,
      departmentId: selectedDepartmentId,
      campusArea,
      termsAgreed,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      const sub = cat?.subcategories.find((s) => s.id === selectedSubcategoryId);
      const dept = departments.find((d) => d.id === selectedDepartmentId);

      const newComplaint = await ComplaintService.submitComplaint(
        {
          title,
          description,
          categoryId: selectedCategoryId,
          categoryName: cat?.name || 'General',
          subcategoryId: selectedSubcategoryId,
          subcategoryName: sub?.name || 'General',
          departmentId: selectedDepartmentId,
          departmentName: dept?.name || 'Administration',
          priority,
          location: {
            campusArea,
            building,
            floor,
            roomNumber,
          },
          attachments,
          preferredContact,
          isSensitive,
        },
        currentUser
      );

      setSubmittedComplaint(newComplaint);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to submit complaint. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmation Success View
  if (submittedComplaint) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <Card className="text-center p-8 bg-white border border-emerald-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Complaint Successfully Lodged</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Your complaint has been assigned a unique tracking number and routed to the responsible college department.
          </p>

          {/* Ticket ID Pill */}
          <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block max-w-md w-full">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Unique Tracking Ticket ID
            </p>
            <p className="text-2xl font-mono font-bold text-indigo-600 mt-0.5">
              {submittedComplaint.id}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Routed to: <strong>{submittedComplaint.departmentName}</strong> • Target SLA:{' '}
              <strong>{submittedComplaint.priority.toUpperCase()}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to={`/student/complaints/${submittedComplaint.id}`}>
              <Button size="md" variant="primary">
                View Activity Timeline & Details <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Button
              size="md"
              variant="outline"
              onClick={() => {
                setSubmittedComplaint(null);
                setTitle('');
                setDescription('');
                setAttachments([]);
                setTermsAgreed(false);
              }}
            >
              Submit Another Complaint
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mb-1">
          <FilePlus2 className="w-4 h-4" />
          <span>New Grievance Registration</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Submit a Complaint</h1>
        <p className="text-xs text-slate-500 mt-1">
          Provide accurate details about the campus issue so the assigned department can investigate and resolve it promptly.
        </p>
      </div>

      {errors.form && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category & Department Selection Card */}
        <Card>
          <CardHeader title="1. Category & Department Routing" />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isSensitive ? '(Confidential Protocol)' : ''}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.categoryId}</p>
                )}
              </div>

              {/* Subcategory */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subcategory <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedSubcategoryId}
                  onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {currentCategory?.subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                {errors.subcategoryId && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.subcategoryId}</p>
                )}
              </div>
            </div>

            {/* Department Routing Info */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-slate-700">Auto-Assigned Department Queue:</p>
                <p className="text-slate-600 mt-0.5">
                  {departments.find((d) => d.id === selectedDepartmentId)?.name || 'Default College Administration'}
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Direct Routing
              </span>
            </div>

            {/* Sensitive / Confidential Flag Warning */}
            {isSensitive && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2.5">
                <Shield className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Confidential Grievance Protocol Active</p>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    This complaint involves sensitive security or harassment policies. It will NOT appear on public department dashboards and will only be handled by the Dean and Proctorial Board.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complaint Details Card */}
        <Card>
          <CardHeader title="2. Issue Description & Priority" />
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Complaint Title / Short Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                placeholder="E.g., High-speed Wi-Fi router offline in Turing Computer Lab 3"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                <span>{errors.title ? <span className="text-rose-600">{errors.title}</span> : 'Be clear and concise'}</span>
                <span>{title.length}/150</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Detailed Problem Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Describe what occurred, how long the issue has persisted, affected students, error messages, or steps already taken..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                <span>
                  {errors.description ? (
                    <span className="text-rose-600">{errors.description}</span>
                  ) : (
                    'Minimum 20 characters'
                  )}
                </span>
                <span>{description.length}/2000</span>
              </div>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assessed Severity / Priority
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['low', 'medium', 'high', 'critical'] as ComplaintPriority[]).map((p) => {
                  const cfg = PRIORITY_CONFIG[p];
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        priority === p
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                        <span className="font-semibold text-xs text-slate-900">{cfg.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Target SLA: {cfg.slaHours} hours</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                * Note: Administrators reserve authority to recalibrate priority if misclassified.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location & Physical Facility Card */}
        <Card>
          <CardHeader title="3. Exact Campus Location" />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Campus Area / Zone <span className="text-rose-500">*</span>
                </label>
                <select
                  value={campusArea}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc.area} value={loc.area}>
                      {loc.area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Building / Wing
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="E.g., Software Lab Annex"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Floor</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="E.g., 2nd Floor, Ground Floor"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Room / Lab / Facility Number
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="E.g., Lab 302, Room 214"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attachments & Preferences */}
        <Card>
          <CardHeader title="4. Supporting Attachments & Contact Preference" />
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload Supporting Images / Documents (Max 5 MB each)
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
                <input
                  type="file"
                  id="complaint-attachment"
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,application/pdf"
                  className="hidden"
                />
                <label htmlFor="complaint-attachment" className="cursor-pointer">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-medium text-indigo-600">
                    Click to browse files or drag and drop
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Supports JPG, PNG, PDF formats up to 5 MB
                  </p>
                </label>
              </div>

              {/* Uploaded attachments list */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{att.fileName}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({(att.fileSize / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Update Method
              </label>
              <div className="flex gap-4 text-xs">
                {(['portal', 'email', 'phone'] as const).map((method) => (
                  <label key={method} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="contactMethod"
                      value={method}
                      checked={preferredContact === method}
                      onChange={() => setPreferredContact(method)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="capitalize">{method === 'portal' ? 'In-Portal Notifications' : method}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                />
                <span>
                  I confirm that the details provided are true and related to college academic or campus facilities.
                  I understand false reporting is subject to institution disciplinary policy.
                </span>
              </label>
              {errors.termsAgreed && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.termsAgreed}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate('/student/dashboard')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="md"
            variant="primary"
            isLoading={isSubmitting}
            icon={<FileCheck2 className="w-4 h-4" />}
          >
            Submit Complaint
          </Button>
        </div>
      </form>
    </div>
  );
};
