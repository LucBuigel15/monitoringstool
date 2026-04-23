import { motion, AnimatePresence } from "framer-motion";
import beigeFace from "../assets/images/blank.avif";
import geel from "../assets/images/geel.avif";
import groen from "../assets/images/groen.avif";
import lichtgroen from "../assets/images/lichtgroen.avif";
import rood from "../assets/images/rood.avif";
import { smileys as SMILEYS, numbers } from "../constants/ratings";

const imageByKey = { rood, beige: beigeFace, geel, lichtgroen, groen };

const pageVariants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

export default function QuestionDisplay({
  question,
  index,
  name,
  value,
  onChange,
  displayMode = "smileys",
}) {
  const groupName = name || `smiley-${question?.uuid || index}`;
  const helperText =
    displayMode === "numbers"
      ? "Kies een cijfer van 1 tot 5"
      : (question?.description || "").trim() || "Welke smiley past het beste?";

  const items = displayMode === "numbers" ? numbers : SMILEYS;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question?.uuid || index}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-4xl text-center px-5 sm:px-10 py-5 bg-transparent rounded-[32px]"
      >
        <p className="text-3xl font-semibold text-white mb-5">Vraag {index}</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-snug">
          {question.title}
        </h2>
        <p className="text-lg sm:text-xl text-white/90 mb-10">{helperText}</p>
        {displayMode === "numbers" ? (
          <div className="flex justify-center gap-4 sm:gap-6">
            {items.map((item) => (
              <label key={item.key} className="flex flex-col items-center cursor-pointer">
                <motion.button
                  type="button"
                  onClick={() => onChange?.(item.key)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full font-bold text-xl sm:text-2xl transition-all shadow-lg ${
                    value === item.key
                      ? "bg-yellow-400 text-teal-900 scale-110"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.1 }}
                >
                  {item.key}
                </motion.button>
                <span className="font-semibold mt-2 text-white text-sm sm:text-base">
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {items.map((s) => (
              <label key={s.key} className="flex flex-col items-center cursor-pointer">
                <motion.img
                  src={imageByKey[s.key]}
                  alt={s.label}
                  className="w-[95px] h-[95px] sm:w-[120px] sm:h-[120px] object-contain"
                  onClick={() => onChange?.(s.key)}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.1 }}
                />
                <input
                  type="radio"
                  name={groupName}
                  value={s.key}
                  checked={value === s.key}
                  onChange={() => onChange?.(s.key)}
                  className="mt-3 scale-110 accent-teal-500"
                />
                <span className="font-semibold mt-2 text-white text-sm sm:text-base">
                  {s.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}