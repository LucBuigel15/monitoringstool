import { useState, useEffect } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import QuestionForm from "../components/QuestionForm";
import StatsSection from "../components/StatsSection";
import ResponsesTable from "../components/ResponsesTable";
import { questionsApi, responsesApi } from "../services/api";
import { getSession, signInWithEmailPassword, signOut } from "../services/auth";
import { CONSENT_QUESTION_UUID } from "../constants/consent";

function SortableQuestionItem({ question, onDelete, onEditClick, onSaveEdit, isEditing, editForm, setEditForm }) {
  const { listeners, setNodeRef, transform, transition, setActivatorNodeRef } = useSortable({
    id: question.uuid,
    disabled: isEditing,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bg-teal-700 p-4 rounded-lg flex justify-between items-center"
    >
      <div className="flex items-start gap-3 flex-1">
        {!isEditing && (
          <button
            ref={setActivatorNodeRef}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-teal-650/40"
            aria-label="Sleep om te sorteren"
            title="Sleep om te sorteren"
            {...listeners}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-gray-200" viewBox="0 0 16 16">
              <path d="M2 3.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8 3.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM14 3.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM14 3.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
            </svg>
          </button>
        )}

        {isEditing ? (
          <div className="space-y-2">
            <input
              className="w-full p-2 rounded text-gray-900"
              placeholder="Titel"
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
            />
            <textarea
              className="w-full p-2 rounded text-gray-900"
              placeholder="Beschrijving"
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <input
                className="flex-1 p-2 rounded text-gray-900"
                placeholder="Categorie"
                value={editForm.category}
                onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
              />
              <select
                className="p-2 rounded text-gray-900"
                value={editForm.priority}
                onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
              <select
                className="p-2 rounded text-gray-900"
                value={editForm.status}
                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="archived">archived</option>
              </select>
            </div>
          </div>
        ) : (
          <>
            <div className="font-semibold">{question.title}</div>
            {question.description && <div className="text-sm text-gray-300">{question.description}</div>}
            <div className="text-xs text-gray-400 mt-1">
              {question.category} | {question.priority} | {question.status}
            </div>
          </>
        )}
      </div>

      {isEditing ? (
        <div className="flex gap-2 ml-4">
          <button
            className="bg-teal-500 px-3 py-1 rounded hover:bg-teal-400"
            onClick={onSaveEdit}
          >
            Opslaan
          </button>
          <button
            className="bg-gray-500 px-3 py-1 rounded hover:bg-gray-400"
            onClick={() => onEditClick(null)}
          >
            Annuleren
          </button>
        </div>
      ) : (
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEditClick(question.uuid)}
            className="bg-yellow-400 text-teal-900 px-3 py-1 rounded hover:bg-yellow-300"
          >
            Bewerken
          </button>
          <button
            onClick={() => onDelete(question.uuid)}
            className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
          >
            Verwijder
          </button>
        </div>
      )}
    </li>
  );
}

export default function Admin() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [editingUuid, setEditingUuid] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: '', priority: 'medium', status: 'active' });
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  // Responses state (Now stores Submissions!)
  const [responses, setResponses] = useState([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [responsesError, setResponsesError] = useState(null);
  const [respPage, setRespPage] = useState(1);
  const [respLimit] = useState(10);
  const [respHasNext, setRespHasNext] = useState(false);
  const [respHasPrev, setRespHasPrev] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // Stats
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const [statsData, setStatsData] = useState([]);
  const [globalStats, setGlobalStats] = useState([]); // Nieuw: Altijd de 'Alle locaties' stats
  const [locationFilter, setLocationFilter] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const currentPasswordValue = localStorage.getItem("survey_password") || import.meta.env.VITE_ACCESS_PASSWORD || "";

  // Simple admin allow-list using env: VITE_ADMIN_EMAILS="a@b.com,c@d.com"
  const allowedEmails = String(import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAuthorized = allowedEmails.length === 0 ? false : allowedEmails.includes(userEmail);

  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        const email = session?.user?.email?.toLowerCase() || "";
        setUserEmail(email);
      } catch (_e) {
        setUserEmail("");
      }
      loadQuestions();
    })();
  }, []);

  // Load responses whenever page or auth changes and user is authorized
  useEffect(() => {
    if (!userEmail || !isAuthorized) return;
    loadResponses(respPage, respLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, isAuthorized, respPage]);

  // Load stats
  useEffect(() => {
    if (!userEmail || !isAuthorized) return;
    loadStats();
    // Also load global stats once for the comparison chart
    loadGlobalStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, isAuthorized, locationFilter]); 

  const loadGlobalStats = async () => {
    try {
      const result = await responsesApi.stats({ location: "" });
      setGlobalStats(result.data || []);
    } catch (e) {
      console.error('Error loading global stats:', e);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      // Geef de locatie mee aan de API call
      const result = await responsesApi.stats({ location: locationFilter });
      setStatsData(result.data || []);
      setStatsError(null);
    } catch (e) {
      console.error('Error loading stats:', e);
      setStatsError('Kon statistieken niet laden');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSavePassword = () => {
    if (currentPassword !== currentPasswordValue) {
      alert("Huidig wachtwoord is incorrect.");
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      alert("Nieuw wachtwoord moet minimaal 4 tekens zijn.");
      return;
    }
    localStorage.setItem("survey_password", newPassword);
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    alert("Wachtwoord succesvol gewijzigd!");
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setQuestions((prev) => {
      const oldIndex = prev.findIndex((q) => q.uuid === active.id);
      const newIndex = prev.findIndex((q) => q.uuid === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionsApi.getAll();
      const filteredQuestions = (response.data || []).filter(
        (q) => q.uuid !== CONSENT_QUESTION_UUID
      );
      setQuestions(filteredQuestions);
      setError(null);
    } catch (err) {
      setError('Failed to load questions');
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async (question) => {
    try {
      const response = await questionsApi.create(question);
      setQuestions(prev => [...prev, response.data]);
      setError(null);
    } catch (err) {
      setError('Failed to add question');
      console.error('Error adding question:', err);
    }
  };

  const deleteQuestion = async (uuid) => {
    try {
      await questionsApi.delete(uuid);
      setQuestions(prev => prev.filter(q => q.uuid !== uuid));
      setError(null);
    } catch (err) {
      setError('Failed to delete question');
      console.error('Error deleting question:', err);
    }
  };

  const loadResponses = async (page, limit) => {
    try {
      setResponsesLoading(true);
      const result = await responsesApi.getSubmissions({ page, limit });
      setResponses(result.data || []);
      const pg = result.pagination || { hasNext: false, hasPrev: false };
      setRespHasNext(Boolean(pg.hasNext));
      setRespHasPrev(Boolean(pg.hasPrev));
      setResponsesError(null);
    } catch (e) {
      console.error('Error loading submissions:', e);
      setResponsesError('Kon inzendingen niet laden');
    } finally {
      setResponsesLoading(false);
    }
  };

  const handleRefreshStats = () => {
    loadStats();
    loadGlobalStats();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-teal-800 text-white p-6 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!userEmail || !isAuthorized) {
    return (
      <div className="min-h-screen bg-teal-800 text-white p-6 flex items-center justify-center">
        <div className="bg-teal-700 p-6 rounded w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4">Admin</h1>
          {!userEmail ? (
            <>
              <p className="mb-4">Log in met je e-mailadres en wachtwoord.</p>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="jij@bedrijf.nl"
                className="w-full p-2 rounded text-gray-900 mb-3"
              />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Wachtwoord"
                className="w-full p-2 rounded text-gray-900 mb-3"
              />
              {authError && (
                <div className="bg-red-500 text-white p-2 rounded mb-3">{authError}</div>
              )}
              <button
                className="bg-yellow-400 text-teal-900 font-semibold px-4 py-2 rounded hover:bg-yellow-300 w-full"
                onClick={async () => {
                  setAuthError(null);
                  try {
                    if (!emailInput.trim() || !passwordInput) return;
                    const { user } = await signInWithEmailPassword(emailInput.trim(), passwordInput);
                    setUserEmail(user?.email?.toLowerCase() || "");
                    window.location.reload();
                  } catch (e) {
                    setAuthError(e.message || 'Login mislukt');
                  }
                }}
              >
                Inloggen
              </button>
              <p className="text-xs text-gray-300 mt-3">Toegestane admins worden ingesteld via <code>VITE_ADMIN_EMAILS</code>.</p>
            </>
          ) : (
            <>
              <p className="mb-4">Geen toegang voor {userEmail}.</p>
              <button
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
                onClick={async () => {
                  await signOut();
                  window.location.reload();
                }}
              >
                Uitloggen
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-teal-800 text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin - Vragen beheren</h1>
        <div className="text-sm text-gray-200 flex items-center gap-3">
          <span>Ingelogd als {userEmail}</span>
          <button
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
            onClick={async () => { await signOut(); window.location.reload(); }}
          >
            Uitloggen
          </button>
        </div>
      </div>

{error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-teal-700 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-3">Wachtwoord wijzigen</h2>
                {localStorage.getItem("survey_password") || import.meta.env.VITE_ACCESS_PASSWORD ? (
                    <>
                        <p className="text-sm text-gray-300 mb-3">
                            Huidig wachtwoord: <span className="font-mono bg-teal-800 px-2 py-1 rounded">••••••••</span>
                        </p>
                        <button
                            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded font-semibold text-sm"
                            onClick={() => setShowPasswordModal(true)}
                        >
                            Wachtwoord wijzigen
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="bg-yellow-500 text-teal-900 px-3 py-1 rounded-full text-sm font-semibold">Geen wachtwoord ingesteld</span>
                        <button
                            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-semibold text-sm"
                            onClick={() => setShowPasswordModal(true)}
                        >
                            Stel wachtwoord in
                        </button>
                    </div>
                )}
            </div>

            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-teal-700 p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Wachtwoord wijzigen</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Huidig wachtwoord</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full p-3 rounded text-gray-800"
                                    placeholder="Huidig wachtwoord"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Nieuw wachtwoord</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-3 rounded text-gray-800"
                                    placeholder="Nieuw wachtwoord (min 4 tekens)"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded font-semibold"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setCurrentPassword("");
                                        setNewPassword("");
                                    }}
                                >
                                    Annuleren
                                </button>
                                <button
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded font-semibold"
                                    onClick={handleSavePassword}
                                >
                                    Opslaan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

      <QuestionForm onAdd={addQuestion} />

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Vragen</h2>
          <button
            className="bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded disabled:opacity-50"
            disabled={savingOrder}
            onClick={async () => {
              try {
                setSavingOrder(true);
                const order = questions.map((q, i) => ({ uuid: q.uuid, position: i + 1 }));
                await questionsApi.reorder(order);
              } catch (e) {
                console.error('Reorder failed', e);
              } finally {
                setSavingOrder(false);
              }
            }}
          >
            {savingOrder ? 'Opslaan...' : 'Volgorde opslaan'}
          </button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={questions.map(q => q.uuid)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-4">
              {questions.map((q) => (
                <SortableQuestionItem
                  key={q.uuid}
                  question={q}
                  onDelete={deleteQuestion}
                  onEditClick={(uuid) => {
                    if (!uuid) { setEditingUuid(null); return; }
                    setEditingUuid(uuid);
                    setEditForm({
                      title: q.title || '',
                      description: q.description || '',
                      category: q.category || '',
                      priority: q.priority || 'medium',
                      status: q.status || 'active',
                    });
                  }}
                  onSaveEdit={async () => {
                    try {
                      const payload = {
                        title: editForm.title,
                        description: editForm.description,
                        category: editForm.category,
                        priority: editForm.priority,
                        status: editForm.status,
                      };
                      const result = await questionsApi.update(q.uuid, payload);
                      const updated = result?.data || payload;
                      setQuestions((prev) => prev.map((it) => (it.uuid === q.uuid ? { ...it, ...updated } : it)));
                      setEditingUuid(null);
                    } catch (e) {
                      console.error('Update failed', e);
                    }
                  }}
                  isEditing={editingUuid === q.uuid}
                  editForm={editForm}
                  setEditForm={setEditForm}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      <StatsSection
        statsData={statsData}
        globalStats={globalStats} 
        fetchLocationStats={async (loc) => (await responsesApi.stats({ location: loc })).data}
        statsLoading={statsLoading}
        statsError={statsError}
        onRefresh={handleRefreshStats}
        selectedLocation={locationFilter}
        onLocationChange={setLocationFilter}
      />

      <ResponsesTable
        responses={responses}
        responsesLoading={responsesLoading}
        responsesError={responsesError}
        respPage={respPage}
        respLimit={respLimit}
        respHasPrev={respHasPrev}
        respHasNext={respHasNext}
        onPrevPage={() => setRespPage((p) => Math.max(1, p - 1))}
        onNextPage={() => setRespPage((p) => p + 1)}
        expandedGroups={expandedGroups}
        setExpandedGroups={setExpandedGroups}
      />
    </div>
  );
}