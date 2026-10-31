import React, { useEffect, useState } from 'react';
import { Edit, FolderTree, Plus, Shield, Trash2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { complaintRepository } from '../../repositories';
import { ComplaintCategory, Department } from '../../types';

export const CategoryManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ComplaintCategory | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultDepartmentId, setDefaultDepartmentId] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const [subcategoriesText, setSubcategoriesText] = useState('');

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const [cats, depts] = await Promise.all([
        complaintRepository.getCategories(),
        complaintRepository.getDepartments(),
      ]);
      setCategories(cats);
      setDepartments(depts);
      if (depts.length > 0) setDefaultDepartmentId(depts[0].id);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCat(null);
    setName('');
    setDescription('');
    setIsSensitive(false);
    setSubcategoriesText('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: ComplaintCategory) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description);
    setDefaultDepartmentId(cat.defaultDepartmentId);
    setIsSensitive(cat.isSensitive);
    setSubcategoriesText(cat.subcategories.map((s) => s.name).join('\n'));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !defaultDepartmentId) return;

    const parsedSubcategories = subcategoriesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s, idx) => ({ id: `sub-${Date.now()}-${idx}`, name: s }));

    if (editingCat) {
      await complaintRepository.updateCategory(
        editingCat.id,
        {
          name,
          description,
          defaultDepartmentId,
          isSensitive,
          subcategories: parsedSubcategories.length > 0 ? parsedSubcategories : editingCat.subcategories,
        },
        currentUser
      );
    } else {
      await complaintRepository.createCategory(
        {
          name,
          description,
          defaultDepartmentId,
          iconName: 'Folder',
          isSensitive,
          isActive: true,
          subcategories: parsedSubcategories,
        },
        currentUser
      );
    }

    setIsModalOpen(false);
    await fetchCategories();
  };

  const handleToggleActive = async (cat: ComplaintCategory) => {
    await complaintRepository.updateCategory(
      cat.id,
      { isActive: !cat.isActive },
      currentUser
    );
    await fetchCategories();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Complaint Categories & Subcategories</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize engineering college grievance taxonomies, default department routes, and confidential protocols
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleOpenAdd} icon={<Plus className="w-3.5 h-3.5" />}>
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const dept = departments.find((d) => d.id === cat.defaultDepartmentId);
          return (
            <Card key={cat.id} className={!cat.isActive ? 'opacity-60 bg-slate-50' : ''}>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <span>{cat.name}</span>
                    {cat.isSensitive && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" /> Confidential
                      </span>
                    )}
                  </div>
                }
                action={
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(cat)}
                      className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer ${
                        cat.isActive ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {cat.isActive ? 'Deactivate' : 'Enable'}
                    </button>
                  </div>
                }
              />
              <CardContent className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed text-[11px]">{cat.description}</p>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Default Department Routing:</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{dept?.name || 'General Administration'}</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5">
                    Subcategories ({cat.subcategories.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {cat.subcategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]"
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCat ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Infrastructure and Maintenance"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope of issues covered by this category..."
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Default Department</label>
            <select
              value={defaultDepartmentId}
              onChange={(e) => setDefaultDepartmentId(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subcategories (One per line)
            </label>
            <textarea
              rows={4}
              value={subcategoriesText}
              onChange={(e) => setSubcategoriesText(e.target.value)}
              placeholder="Classroom Maintenance&#10;Electrical Issues&#10;Water Supply&#10;Furniture Damage"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500 font-mono"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isSensitive}
                onChange={(e) => setIsSensitive(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 mt-0.5"
              />
              <div>
                <span className="font-semibold text-rose-800">
                  Mark as Confidential / Sensitive Grievance
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Complaints in this category will bypass public staff dashboards and remain restricted only to the Dean and Confidential Proctorial Board.
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
