
import React, { useState, useEffect } from 'react';
import { User, DocumentCategory, DocumentTemplate } from '../types';
import { Card, Button, Input } from '../components/UI';
import { 
  getDocCategories, saveDocCategory, deleteDocCategory,
  getDocTemplates, saveDocTemplate, deleteDocTemplate
} from '../services/storageService';
import { 
  Plus, FolderOpen, FilePlus, PenTool, Trash2, X, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { DocumentEditor } from '../components/DocumentEditor';

interface DocumentsProps {
  user: User;
  embedded?: boolean;
}

export const Documents: React.FC<DocumentsProps> = ({ user, embedded = false }) => {
  if (!user.companyId) return <div>Brak dostępu.</div>;

  const [docCategories, setDocCategories] = useState<DocumentCategory[]>([]);
  const [docTemplates, setDocTemplates] = useState<DocumentTemplate[]>([]);
  const [showDocEditor, setShowDocEditor] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | undefined>(undefined);

  useEffect(() => {
     loadData();
  }, [user.companyId]);

  const loadData = async () => {
     if(!user.companyId) return;
     setDocCategories(await getDocCategories(user.companyId));
     setDocTemplates(await getDocTemplates(user.companyId));
  };

  const handleAddCategory = (e: React.FormEvent) => {
     e.preventDefault();
     if(!newCategoryName) return;
     saveDocCategory({ companyId: user.companyId!, name: newCategoryName });
     setNewCategoryName('');
     setShowCategoryForm(false);
     loadData();
     toast.success('Kategoria dodana');
  };

  const handleSaveDocument = (templateData: Partial<DocumentTemplate>) => {
     saveDocTemplate({ 
        ...templateData, 
        id: editingTemplate?.id,
        companyId: user.companyId! 
     });
     setShowDocEditor(false);
     setEditingTemplate(undefined);
     loadData();
     toast.success('Dokument zapisany');
  };

  const openEditor = (template?: DocumentTemplate) => {
     setEditingTemplate(template);
     setShowDocEditor(true);
  };

  const deleteTemplate = (id: string) => {
     if(confirm('Usunąć szablon?')) {
        deleteDocTemplate(id);
        loadData();
        toast.info('Szablon usunięty');
     }
  };

  const handleDeleteCategory = (id: string) => {
    if(confirm('Usunąć kategorię?')) {
       deleteDocCategory(id);
       loadData();
       toast.info('Kategoria usunięta');
    }
  };

  if (showDocEditor) {
     return <DocumentEditor 
        initialTemplate={editingTemplate} 
        categories={docCategories} 
        onSave={handleSaveDocument} 
        onCancel={() => setShowDocEditor(false)} 
     />;
  }

  return (
    <div className={`space-y-6 animate-fade-in ${embedded ? '' : 'pb-20'}`}>
       {!embedded && (
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
               <h2 className="text-3xl font-bold flex items-center gap-3"><FileText className="text-[var(--color-chart-4)]"/> Dokumenty</h2>
               <p className="text-[var(--color-text-secondary)]">Szablony i generowanie pism</p>
            </div>
         </div>
       )}

      <div className="space-y-6">
         {/* Categories Section */}
         <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
            <button onClick={() => setShowCategoryForm(!showCategoryForm)} className="flex flex-col items-center justify-center min-w-[6rem] h-24 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] bg-[var(--color-surface)]">
               <Plus size={24}/>
               <span className="text-xs font-bold">Kategoria</span>
            </button>
            {docCategories.map(cat => (
               <div key={cat.id} className="min-w-[8rem] h-24 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 flex flex-col justify-between group relative shadow-sm">
                  <FolderOpen size={24} className="text-[var(--color-chart-2)]"/>
                  <span className="text-xs font-bold truncate" title={cat.name}>{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="absolute top-1 right-1 p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
               </div>
            ))}
         </div>

         {showCategoryForm && (
            <Card className="max-w-md bg-[var(--color-surface-highlight)] border border-[var(--color-border)]">
               <form onSubmit={handleAddCategory} className="flex gap-2">
                  <Input placeholder="Nazwa Kategorii" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} autoFocus className="bg-white" />
                  <Button type="submit">Dodaj</Button>
               </form>
            </Card>
         )}

         {/* Templates Section */}
         <div className="border-t border-[var(--color-border)] pt-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Szablony Dokumentów</h3>
                <Button onClick={() => openEditor()}><FilePlus size={18} className="mr-2"/> Utwórz Dokument</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
               {docTemplates.map(template => {
                  const catName = docCategories.find(c => c.id === template.categoryId)?.name || 'Bez kategorii';
                  return (
                     <div key={template.id} className="group relative aspect-[1/1.414] bg-white border border-[var(--color-border)] rounded-lg shadow-sm hover:shadow-xl hover:scale-105 transition-all overflow-hidden cursor-pointer" onClick={() => openEditor(template)}>
                        {/* Thumbnail Preview (Mock) */}
                        <div className="w-full h-full p-4 flex flex-col items-center justify-center text-[var(--color-text-secondary)] bg-[var(--color-muted)] bg-opacity-10">
                           <PenTool size={32} className="mb-2 opacity-30 group-hover:opacity-60 transition-opacity"/>
                           <span className="text-[10px] uppercase font-bold text-center text-black/50">{template.name}</span>
                        </div>
                        
                        <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm p-3 border-t border-[var(--color-border)]">
                           <div className="text-sm font-bold truncate text-gray-800">{template.name}</div>
                           <div className="text-[10px] text-gray-500 truncate">{catName}</div>
                        </div>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                           <button onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }} className="p-1.5 bg-white rounded-full shadow text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={14}/></button>
                        </div>
                     </div>
                  )
               })}
               {docTemplates.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center p-12 text-[var(--color-text-secondary)] border-2 border-dashed border-[var(--color-border)] rounded-2xl">
                     <FileText size={48} className="mb-4 opacity-20"/>
                     <span className="italic">Brak szablonów. Kliknij "Utwórz Dokument" aby dodać pierwszy.</span>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};
