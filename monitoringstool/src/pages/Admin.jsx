import { useState, useEffect, useCallback } from "react";
import { Mars, Venus, Eye, EyeOff } from "lucide-react";
import QuestionForm from "../components/QuestionForm";
import StatsSection from "../components/StatsSection";
import ResponsesTable from "../components/ResponsesTable";
import { questionsApi, responsesApi } from "../services/api";
import { getSession, signInWithEmailPassword, signOut } from "../services/auth";
import { CONSENT_QUESTION_UUID } from "../constants/consent";
import { getLocations, createLocation, deleteLocation, updateLocation } from "../constants/locations";

function QuestionItem({ question, onDelete, onEditClick, onSaveEdit, isEditing, editForm, setEditForm, onPositionChange }) {
    return (
        <li className="bg-teal-700 p-4 rounded-lg flex items-center gap-3">
            <input
                type="number"
                min="0"
                className="w-14 p-1 rounded text-gray-900 text-center text-sm"
                value={question.position ?? 0}
                onChange={(e) => onPositionChange(question.uuid, parseInt(e.target.value) || 0)}
                disabled={isEditing}
                title="Positie (volgorde)"
            />
            <div className="flex items-start gap-3 flex-1">
                {isEditing ? (
                    <div className="space-y-2 w-full">
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
                        <div className="flex gap-2">
                            <select
                                className="flex-1 p-2 rounded text-gray-900"
                                value={editForm.type}
                                onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                            >
                                <option value="smiley">Smileys</option>
                                <option value="number">Cijfers (1-5)</option>
                                <option value="scale">Schaal (1-10)</option>
                                <option value="boolean">Ja/Nee</option>
                                <option value="open">Open vraag</option>
                                <option value="multiple_choice">Meerkeuze (enkel)</option>
                                <option value="multiple_select">Meerkeuze (meerdere)</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="flex-1 p-2 rounded text-gray-900"
                                value={editForm.age_group}
                                onChange={(e) => setEditForm((f) => ({ ...f, age_group: e.target.value }))}
                            >
                                <option value="all">Alle leeftijden</option>
                                <option value="under_12">Onder 12 jaar</option>
                                <option value="12_plus">12 jaar of ouder</option>
                            </select>
                            <select
                                className="flex-1 p-2 rounded text-gray-900"
                                value={editForm.mode}
                                onChange={(e) => setEditForm((f) => ({ ...f, mode: e.target.value }))}
                            >
                                <option value="regular">Regulier</option>
                                <option value="ouder_kind">Ouder-kind</option>
                                <option value="extra_vader_kind">Extra vader-kind</option>
                            </select>
                        </div>
                        <div className="text-xs text-gray-400">
                            Gebruik <code>{`{parent}`}</code> voor &quot;papa&quot;/&quot;mama&quot;
                        </div>
                        {(editForm.type === "multiple_choice" || editForm.type === "multiple_select") && (
                            <textarea
                                className="w-full p-2 rounded text-gray-900"
                                placeholder="Opties (één per regel)"
                                value={Array.isArray(editForm.options) ? editForm.options.join("\n") : ""}
                                onChange={(e) =>
                                    setEditForm((f) => ({ ...f, options: e.target.value.split("\n").filter(Boolean) }))
                                }
                                rows={3}
                            />
                        )}
                    </div>
                ) : (
                    <>
                        <div className="font-semibold">{question.title}</div>
                        {question.description && <div className="text-sm text-gray-300">{question.description}</div>}
                        <div className="text-xs text-gray-400 mt-1">
                            {question.category} | {question.priority} | {question.status} | {question.type || "smiley"} |{" "}
                            {question.age_group || "all"}
                            {question.gender && <span className={`ml-1 font-semibold ${question.gender === "female" ? "text-pink-300" : "text-blue-300"}`}>
                                {question.gender === "female" ? <Venus className="inline w-4 h-4" /> : question.gender === "male" ? <Mars className="inline w-4 h-4" /> : "Alle"}
                            </span>}
                        </div>
                    </>
                )}
            </div>

            {isEditing ? (
                <div className="flex gap-2 ml-4">
                    <button className="bg-teal-500 px-3 py-1 rounded hover:bg-teal-400" onClick={onSaveEdit}>
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
    const [editForm, setEditForm] = useState({
        title: "",
        description: "",
        category: "",
        priority: "medium",
        status: "active",
        type: "smiley",
        options: null,
        age_group: "all",
        mode: "regular",
    });
    const [showTypeEditModal, setShowTypeEditModal] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [showAdminPassword, setShowAdminPassword] = useState(false);
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
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [adminList, setAdminList] = useState([]);
    const [reorderError, setReorderError] = useState(null);
    const [updateError, setUpdateError] = useState(null);
    const [piList, setPiList] = useState([]);
    const [newPiName, setNewPiName] = useState("");
    const [newPiGender, setNewPiGender] = useState("male");
    const [filterGender, setFilterGender] = useState("all");

    const currentPasswordValue = localStorage.getItem("survey_password") || import.meta.env.VITE_ACCESS_PASSWORD || "";

    // Simple admin allow-list using env: VITE_ADMIN_EMAILS="a@b.com,c@d.com"
    const allowedEmails = String(import.meta.env.VITE_ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

    const adminEmails = adminList.map((a) => a.email.toLowerCase());
    const allAllowedEmails = [...allowedEmails, ...adminEmails];
    const isAuthorized = allAllowedEmails.length === 0 ? false : allAllowedEmails.includes(userEmail);

    useEffect(() => {
        getLocations().then(setPiList).catch(() => setPiList([]));
    }, []);

    useEffect(() => {
        document.title = "Kinderenquête Admin - Vragen beheren";
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
            console.error("Error loading global stats:", e);
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
            console.error("Error loading stats:", e);
            setStatsError("Kon statistieken niet laden");
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

    // Admin management
    const loadAdmins = () => {
        try {
            const stored = localStorage.getItem("survey_admins");
            if (stored) {
                setAdminList(JSON.parse(stored));
            } else {
                const envEmails = (import.meta.env.VITE_ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);
                const defaultAdmins = envEmails.map(email => ({ email, createdAt: new Date().toISOString() }));
                setAdminList(defaultAdmins);
                localStorage.setItem("survey_admins", JSON.stringify(defaultAdmins));
            }
        } catch {
            setAdminList([]);
        }
    };

    useEffect(() => {
        loadAdmins();
    }, []);

    const handleAddAdmin = () => {
        if (!adminEmail || !adminPassword) {
            alert("Vul e-mail en wachtwoord in.");
            return;
        }
        if (!adminEmail.includes("@")) {
            alert("Ongeldig e-mailadres.");
            return;
        }
        if (adminPassword.length < 4) {
            alert("Wachtwoord moet minimaal 4 tekens zijn.");
            return;
        }
        const exists = adminList.find((a) => a.email.toLowerCase() === adminEmail.toLowerCase());
        if (exists) {
            alert("Deze admin bestaat al.");
            return;
        }
        const newAdmin = {
            email: adminEmail.toLowerCase(),
            password: btoa(adminPassword),
            createdAt: new Date().toISOString(),
        };
        const updated = [...adminList, newAdmin];
        setAdminList(updated);
        localStorage.setItem("survey_admins", JSON.stringify(updated));
        setAdminEmail("");
        setAdminPassword("");
        setShowAdminModal(false);
        alert("Admin toegevoegd!");
    };

    const handleRemoveAdmin = (email) => {
        if (!confirm(`Admin "${email}" verwijderen?`)) return;
        const updated = adminList.filter((a) => a.email !== email);
        setAdminList(updated);
        localStorage.setItem("survey_admins", JSON.stringify(updated));
    };

    const handleChangeAdminPassword = (email) => {
        const newPass = prompt(`Nieuw wachtwoord voor ${email}:`);
        if (!newPass || newPass.length < 4) {
            alert("Wachtwoord moet minimaal 4 tekens zijn.");
            return;
        }
        const updated = adminList.map((a) => (a.email === email ? { ...a, password: btoa(newPass) } : a));
        setAdminList(updated);
        localStorage.setItem("survey_admins", JSON.stringify(updated));
        alert(`Wachtwoord voor ${email} gewijzigd!`);
    };

    const updatePosition = (uuid, newPosition) => {
        setQuestions((prev) => {
            const updated = prev.map((q) =>
                q.uuid === uuid ? { ...q, position: newPosition } : q
            );
            return [...updated].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        });
    };

    const loadQuestions = async () => {
        try {
            setLoading(true);
            const response = await questionsApi.getAll();
            const filteredQuestions = (response.data || []).filter((q) => q.uuid !== CONSENT_QUESTION_UUID);
            setQuestions(filteredQuestions);
            setError(null);
        } catch (err) {
            setError("Failed to load questions");
            console.error("Error loading questions:", err);
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = async (question) => {
        try {
            const response = await questionsApi.create(question);
            setQuestions((prev) =>
                [...prev, response.data].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            );
            setError(null);
        } catch (err) {
            setError("Failed to add question");
            console.error("Error adding question:", err);
        }
    };

    const deleteQuestion = async (uuid) => {
        try {
            await questionsApi.delete(uuid);
            setQuestions((prev) => prev.filter((q) => q.uuid !== uuid));
            setError(null);
        } catch (err) {
            setError("Failed to delete question");
            console.error("Error deleting question:", err);
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
            console.error("Error loading submissions:", e);
            setResponsesError("Kon inzendingen niet laden");
        } finally {
            setResponsesLoading(false);
        }
    };

    const handleDeleteSubmission = async (uuid) => {
        try {
            await responsesApi.deleteSubmission(uuid);
            setResponses((prev) => prev.filter((s) => s.uuid !== uuid));
        } catch (e) {
            console.error("Error deleting submission:", e);
            alert("Verwijderen mislukt: " + e.message);
        }
    };

    const handleRefreshStats = () => {
        loadStats();
        loadGlobalStats();
    };

    const fetchLocationStats = useCallback(async (loc) => (await responsesApi.stats({ location: loc })).data, []);

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
                            <div className="relative mb-3">
                                <input
                                    type={showAdminPassword ? "text" : "password"}
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="Wachtwoord"
                                    className="w-full p-2 pr-10 rounded text-gray-900"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showAdminPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {authError && <div className="bg-red-500 text-white p-2 rounded mb-3">{authError}</div>}
                            <button
                                className="bg-yellow-400 text-teal-900 font-semibold px-4 py-2 rounded hover:bg-yellow-300 w-full"
                                onClick={async () => {
                                    setAuthError(null);
                                    try {
                                        if (!emailInput.trim() || !passwordInput) return;
                                        const { user } = await signInWithEmailPassword(
                                            emailInput.trim(),
                                            passwordInput,
                                        );
                                        setUserEmail(user?.email?.toLowerCase() || "");
                                        window.location.reload();
                                    } catch (e) {
                                        setAuthError(e.message || "Login mislukt");
                                    }
                                }}
                            >
                                Inloggen
                            </button>
                            <p className="text-xs text-gray-300 mt-3">
                                Toegestane admins worden ingesteld via <code>VITE_ADMIN_EMAILS</code>.
                            </p>
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
                        onClick={async () => {
                            await signOut();
                            window.location.reload();
                        }}
                    >
                        Uitloggen
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}
            {reorderError && <div className="bg-red-500 text-white p-3 rounded mb-4">{reorderError}</div>}
            {updateError && <div className="bg-red-500 text-white p-3 rounded mb-4">{updateError}</div>}

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
                        <span className="bg-yellow-500 text-teal-900 px-3 py-1 rounded-full text-sm font-semibold">
                            Geen wachtwoord ingesteld
                        </span>
                        <button
                            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-semibold text-sm"
                            onClick={() => setShowPasswordModal(true)}
                        >
                            Stel wachtwoord in
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-teal-700 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">Admins beheren</h2>
                <div className="space-y-2 mb-3">
                    {adminList.map((admin, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-teal-600 p-2 rounded">
                            <span className="text-sm">{admin.email}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleChangeAdminPassword(admin.email)}
                                    className="text-yellow-300 text-xs hover:underline"
                                >
                                    Wachtwoord
                                </button>
                                <button
                                    onClick={() => handleRemoveAdmin(admin.email)}
                                    className="text-red-300 text-xs hover:underline"
                                >
                                    Verwijder
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-semibold text-sm"
                    onClick={() => setShowAdminModal(true)}
                >
                    Admin toevoegen
                </button>
            </div>

            {showAdminModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-teal-700 p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Admin toevoegen</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">E-mailadres</label>
                                <input
                                    type="email"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    className="w-full p-3 rounded text-gray-800"
                                    placeholder="admin@bedrijf.nl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Wachtwoord</label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="w-full p-3 rounded text-gray-800"
                                    placeholder="Wachtwoord (min 4 tekens)"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded font-semibold"
                                    onClick={() => {
                                        setShowAdminModal(false);
                                        setAdminEmail("");
                                        setAdminPassword("");
                                    }}
                                >
                                    Annuleren
                                </button>
                                <button
                                    className="flex-1 bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-semibold"
                                    onClick={handleAddAdmin}
                                >
                                    Toevoegen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

            <div className="bg-teal-700 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-3">PI's beheren</h2>
              <div className="space-y-2 mb-3">
                  {piList.map((pi, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-teal-600 p-2 rounded">
                    <span className="text-sm">
                      PI {pi.name} <span className="text-gray-300">{pi.gender === "female" ? <Venus className="inline w-4 h-4 text-pink-300" /> : <Mars className="inline w-4 h-4 text-blue-300" />}</span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const newGender = pi.gender === "male" ? "female" : "male";
                          try {
                            await updateLocation(pi.name, newGender);
                            setPiList(prev => prev.map((p, i) => i === idx ? { ...p, gender: newGender } : p));
                          } catch (e) {
                            alert(e.message);
                          }
                        }}
                        className="text-yellow-300 text-xs hover:underline"
                      >
                        {pi.gender === "male" ? "Zet op vrouwelijk" : "Zet op mannelijk"}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await deleteLocation(pi.name);
                            setPiList(prev => prev.filter((_, i) => i !== idx));
                          } catch (e) {
                            alert(e.message);
                          }
                        }}
                        className="text-red-300 text-xs hover:underline"
                      >
                        Verwijder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newPiName}
                    onChange={(e) => setNewPiName(e.target.value)}
                    placeholder="PI naam"
                    className="w-full p-2 rounded text-gray-800 text-sm"
                  />
                </div>
                <select
                  value={newPiGender}
                  onChange={(e) => setNewPiGender(e.target.value)}
                  className="p-2 rounded text-gray-800 text-sm"
                >
                  <option value="male"><Mars className="inline w-4 h-4" /> Mannelijk</option>
                  <option value="female"><Venus className="inline w-4 h-4" /> Vrouwelijk</option>
                </select>
                <button
                  className="bg-green-500 hover:bg-green-600 px-3 py-2 rounded font-semibold text-sm whitespace-nowrap"
                  onClick={async () => {
                    const name = newPiName.trim();
                    if (!name) return;
                    if (piList.find(p => p.name === name)) {
                      alert("Deze PI bestaat al.");
                      return;
                    }
                    try {
                      await createLocation(name, newPiGender);
                      setPiList(prev => [...prev, { name, gender: newPiGender }]);
                      setNewPiName("");
                      setNewPiGender("male");
                    } catch (e) {
                      alert(e.message);
                    }
                  }}
                >
                  Toevoegen
                </button>
              </div>
            </div>

            <QuestionForm onAdd={addQuestion} />

            <div className="mt-6">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <h2 className="text-xl font-semibold">Vragen</h2>
                    <div className="flex gap-2">
                        <div className="flex gap-1 bg-teal-800 rounded-lg p-1">
                            {[
                                { value: "all", label: "Alle", icon: null },
                                { value: "male", label: "Mannen", icon: Mars },
                                { value: "female", label: "Vrouwen", icon: Venus },
                            ].map((opt) => { const Icon = opt.icon; return (
                                <button
                                    key={opt.value}
                                    onClick={() => setFilterGender(opt.value)}
                                    className={`px-3 py-1 rounded text-sm font-semibold transition ${
                                        filterGender === opt.value
                                            ? "bg-yellow-400 text-teal-900"
                                            : "text-gray-300 hover:text-white"
                                    }`}
                                >
                                    {Icon && <Icon className="inline w-4 h-4 mr-1" />}{opt.label}
                                </button>
                            );
                        })}
                        </div>
                        <button
                            className="bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded disabled:opacity-50 text-sm"
                            disabled={savingOrder}
                            onClick={async () => {
                                try {
                                    setSavingOrder(true);
                                    setReorderError(null);
                                    const order = questions.map((q) => ({ uuid: q.uuid, position: q.position ?? 0 }));
                                    await questionsApi.reorder(order);
                                } catch (e) {
                                    console.error("Reorder failed", e);
                                    setReorderError("Volgorde opslaan mislukt");
                                } finally {
                                    setSavingOrder(false);
                                }
                            }}
                        >
                            {savingOrder ? "Opslaan..." : "Volgorde opslaan"}
                        </button>
                    </div>
                </div>
                <ul className="space-y-4">
                    {questions
                        .filter((q) => filterGender === "all" || q.gender === filterGender || q.gender === "all")
                        .map((q) => (
                        <QuestionItem
                            key={q.uuid}
                            question={q}
                            onDelete={deleteQuestion}
                            onPositionChange={updatePosition}
                            onEditClick={(uuid) => {
                                if (!uuid) {
                                    setEditingUuid(null);
                                    return;
                                }
                                setEditingUuid(uuid);
                                const q = questions.find((q) => q.uuid === uuid);
                                setEditForm({
                                    title: q?.title || "",
                                    description: q?.description || "",
                                    category: q?.category || "",
                                    priority: q?.priority || "medium",
                                    status: q?.status || "active",
                                    type: q?.type || "smiley",
                                    options: q?.options || null,
                                    age_group: q?.age_group || "all",
                                    mode: q?.mode || "regular",
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
                                        type: editForm.type,
                                        options: editForm.type === "multiple_choice" || editForm.type === "multiple_select" ? editForm.options : null,
                                        age_group: editForm.age_group,
                                        mode: editForm.mode,
                                    };
                                    const result = await questionsApi.update(q.uuid, payload);
                                    const updated = result?.data || payload;
                                    setQuestions((prev) =>
                                        prev.map((it) => (it.uuid === q.uuid ? { ...it, ...updated } : it)),
                                    );
                                    setEditingUuid(null);
                                } catch (e) {
                                    console.error("Update failed", e);
                                    setUpdateError("Vraag bijwerken mislukt");
                                }
                            }}
                            isEditing={editingUuid === q.uuid}
                            editForm={editForm}
                            setEditForm={setEditForm}
                        />
                    ))}
                </ul>
            </div>

            <StatsSection
                statsData={statsData}
                globalStats={globalStats}
                fetchLocationStats={fetchLocationStats}
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
                onDeleteSubmission={handleDeleteSubmission}
            />
        </div>
    );
}
