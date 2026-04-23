import { useState, useEffect } from "react";
import QuestionDisplay from "../components/QuestionDisplay";
import ConsentQuestion from "../components/ConsentQuestion";
import StartScreen from "../components/StartScreen";
import { questionsApi, responsesApi } from "../services/api";
import { RATING_LABELS } from "../constants/ratings";
import { CONSENT_QUESTION_UUID } from "../constants/consent";
import groenImage from "../assets/images/groen.avif"; 

export default function Survey() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [answers, setAnswers] = useState({});
  const [consent, setConsent] = useState(null); 
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [mode, setMode] = useState("regular");
  const [location, setLocation] = useState(null);
  const [showStart, setShowStart] = useState(true);
  const [useNumbers, setUseNumbers] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("survey_state");
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setAnswers(state.answers || {});
        setConsent(state.consent);
        setCurrentQuestionIndex(state.currentQuestionIndex || 0);
        setMode(state.mode);
        setLocation(state.location);
        setUseNumbers(state.useNumbers || false);
        if (state.location && state.mode) {
          setShowStart(false);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!showStart) {
      localStorage.setItem("survey_state", JSON.stringify({
        answers,
        consent,
        currentQuestionIndex,
        mode,
        location,
        useNumbers
      }));
    }
  }, [answers, consent, currentQuestionIndex, mode, location, showStart, useNumbers]);

  const clearSurveyState = () => {
    localStorage.removeItem("survey_state");
    setAnswers({});
    setConsent(null);
    setCurrentQuestionIndex(0);
    setShowStart(true);
    setUseNumbers(false);
  };

  useEffect(() => {
    if (!showStart) loadQuestions();
  }, [showStart]);

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
      console.error(err);
      setError("Vragen konden niet geladen worden.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (questionUuid, value) => {
    setAnswers((prev) => ({ ...prev, [questionUuid]: value }));
    if (autoAdvance && currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 300);
    }
  };

  const handleNext = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!consent) {
      setSubmitError("Beantwoord eerst de toestemmingsvraag.");
      return;
    }

    if (consent === "nee") {
      setSubmitError("Zonder toestemming kunnen we de vragenlijst niet invullen.");
      return;
    }

    const unanswered = questions.filter((q) => !answers[q.uuid]);
    if (unanswered.length > 0) {
      setSubmitError("Beantwoord alle vragen voordat je verstuurt.");
      return;
    }

    const responses = [
      {
        question_uuid: CONSENT_QUESTION_UUID,
        response_data: {
          value: consent,
          label: consent === "ja" ? "Ja" : "Nee",
        },
      },
      ...questions.map((q) => ({
        question_uuid: q.uuid,
        response_data: {
          value: answers[q.uuid],
          label: RATING_LABELS[answers[q.uuid]] || answers[q.uuid],
        },
      })),
    ];

    try {
      setSubmitting(true);
      // STUUR NU OOK LOCATION MEE
      await responsesApi.submit({
        survey_type: mode,
        location: location, 
        responses,
      });
      setSubmitted(true);
      localStorage.removeItem("survey_state");
      setAnswers({});
      setConsent(null);
      setCurrentQuestionIndex(0);
      setShowStart(true);
    } catch (e) {
      console.error(e);
      setSubmitError("Versturen mislukt. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (submitted) {
      return (
        <div className="flex flex-col items-center text-center p-6 animate-in fade-in zoom-in duration-300">
          <img
            src={groenImage}
            alt="Bedankt"
            className="w-40 mx-auto mb-6 rounded-lg mt-8"
          />
          <h2 className="text-4xl font-bold mb-4">
            Bedankt voor het invullen!
          </h2>
          <p className="mb-6 text-xl text-gray-200">
            Je antwoorden zijn goed ontvangen voor locatie <span className="font-bold text-yellow-400">{location}</span>.
          </p>
          <button
            className="bg-yellow-400 text-teal-900 font-semibold px-6 py-3 rounded-full hover:bg-yellow-300 transition"
            onClick={() => {
              clearSurveyState();
            }}
          >
            Nieuwe vragenlijst
          </button>
        </div>
      );
    }

    if (loading) return <p>Laden...</p>;

    if (error) {
      return (
        <div className="bg-red-600/80 text-white px-6 py-4 rounded-xl">
          {error}
        </div>
      );
    }

    // STAP 0: TOESTEMMING
    if (!consent) {
      return (
        <>
          <ConsentQuestion
            value={consent}
            onChange={(val) => {
              setConsent(val);
              if (val === "nee") {
                setSubmitError("Zonder toestemming kunnen we de vragenlijst niet invullen.");
              } else {
                setSubmitError(null);
                setCurrentQuestionIndex(0);
              }
            }}
          />
          {consent === "nee" && (
            <div className="bg-red-600/80 text-white px-6 py-3 rounded-xl">
              Zonder toestemming kunnen we de vragenlijst niet invullen.
            </div>
          )}
        </>
      );
    }

    if (consent === "nee") {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6">
          <div className="bg-red-600/80 text-white px-6 py-4 rounded-xl mb-4">
            <h2 className="text-2xl font-bold mb-2">Geen toestemming</h2>
            <p>Vraag even aan je begeleider wat je nu moet doen.</p>
          </div>
          <button
            className="bg-yellow-400 text-teal-900 font-semibold px-6 py-3 rounded-full hover:bg-yellow-300 transition"
            onClick={() => {
              setConsent(null);
              setAnswers({});
            }}
          >
            Opnieuw proberen
          </button>
        </div>
      );
    }

    if (questions.length === 0) {
      return <p>Er zijn nog geen vragen toegevoegd.</p>;
    }

    // DE VRAGEN ZELF
    const currentQ = questions[currentQuestionIndex];
    const hasAnsweredCurrent = answers[currentQ.uuid] !== undefined;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
      <div className="w-full flex flex-col items-center animate-in slide-in-from-right-8 fade-in duration-500">
          <div className="w-full max-w-2xl mb-4 flex justify-between items-center px-4">
             <span className="text-teal-200 text-sm">Locatie: <span className="font-semibold text-white">{location}</span></span>
             <span className="text-teal-200 text-sm">{mode === 'ouder_kind' ? 'Ouder-Kind Dag' : 'Regulier'}</span>
          </div>

          <QuestionDisplay
            key={currentQ.uuid}
            question={currentQ}
            index={currentQuestionIndex + 1}
            name={`smiley-${currentQ.uuid}`}
            value={answers[currentQ.uuid] || null}
            onChange={(val) => handleChange(currentQ.uuid, val)}
            displayMode={useNumbers ? "numbers" : "smileys"}
          />

          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
             {currentQuestionIndex > 0 && (
                <button 
                    className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition"
                    onClick={handlePrevious}
                    disabled={submitting}
                >
                    Vorige
                </button>
             )}
             
             <button 
                className={`flex-grow px-8 py-3 rounded-full font-bold text-lg transition shadow-lg
                    ${hasAnsweredCurrent && !submitting
                        ? "bg-yellow-400 text-teal-900 hover:bg-yellow-300 hover:scale-105" 
                        : "bg-gray-500/50 text-gray-300 cursor-not-allowed"
                    }`}
                onClick={isLastQuestion ? handleSubmit : handleNext}
                disabled={!hasAnsweredCurrent || submitting}
             >
                {isLastQuestion 
                  ? (submitting ? "Even geduld..." : "Vragen versturen") 
                  : "Volgende vraag"}
             </button>
          </div>

          <div className="mt-6 text-sm text-white/40">
             Vraag {currentQuestionIndex + 1} van {questions.length}
          </div>
      </div>
    );
  };

  return (
    <>
      {showStart ? (
        <StartScreen
          onStart={(selectedMode, selectedLocation, selectedUseNumbers) => {
            setMode(selectedMode);
            setLocation(selectedLocation);
            setUseNumbers(selectedUseNumbers);
            setShowStart(false);
          }}
        />
      ) : (
        <section className="w-full max-w-5xl flex flex-col items-center gap-6 text-white text-center py-8">
          <div className="w-full flex justify-start">
            <button
              className="text-teal-200 hover:text-white text-sm flex items-center gap-1"
              onClick={clearSurveyState}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
              </svg>
              Terug naar home
            </button>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold">
            Vragenlijst
          </h1>

          {submitError && (
            <div className="bg-red-600/80 text-white px-6 py-3 rounded-xl">
              {submitError}
            </div>
          )}

          <div className="w-full flex flex-col items-center justify-start pt-10 min-h-[400px]">
            {renderContent()}
          </div>
        </section>
      )}
    </>
  );
}