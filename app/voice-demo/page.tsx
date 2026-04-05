"use client";

import { useState } from "react";
import { VoiceConfessModal } from "@/app/components/VoiceConfessModal";
import { motion } from "framer-motion";
import { Mic, X } from "lucide-react";

export default function VoiceConfessionsDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittedConfession, setSubmittedConfession] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-3">🎤 Voice Confessions</h1>
        <p className="text-lg text-gray-600 mb-6">
          Test the voice confession feature with beautiful animations.
        </p>
      </div>

      {/* Demo Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Feature 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <div className="text-3xl mb-3">🎙️</div>
          <h3 className="text-xl font-bold mb-2">Easy Recording</h3>
          <p className="text-gray-600 text-sm mb-4">
            Record voice messages with a simple UI. Supports 15-30 second
            recordings with real-time timer.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
          >
            Try Recording
          </button>
        </motion.div>

        {/* Feature 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="text-xl font-bold mb-2">Privacy First</h3>
          <p className="text-gray-600 text-sm mb-4">
            All voice confessions are fully anonymous — no names, no traces.
          </p>
          <div className="text-xs text-gray-500">
            ✓ Client-side processing
            <br />✓ Cloudinary storage
            <br />✓ No IP logging
          </div>
        </motion.div>

        {/* Feature 3 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <div className="text-3xl mb-3">✨</div>
          <h3 className="text-xl font-bold mb-2">Beautiful Animations</h3>
          <p className="text-gray-600 text-sm mb-4">
            React Spring physics animations + Framer Motion. Cartoonish waveform
            bounces to audio frequency in real-time.
          </p>
          <div className="text-xs text-gray-500">
            ✓ 40-bar waveform
            <br />✓ Spring physics
            <br />✓ Responsive
          </div>
        </motion.div>

        {/* Feature 4 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-xl font-bold mb-2">Mixed Feed</h3>
          <p className="text-gray-600 text-sm mb-4">
            Voice confessions appear alongside text confessions in the explore
            feed with beautiful cards.
          </p>
          <div className="text-xs text-gray-500">
            ✓ Coverflow carousel
            <br />✓ Category filters
            <br />✓ Reactions
          </div>
        </motion.div>
      </div>

      {/* Technical Stack */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200 mb-8"
      >
        <h2 className="text-2xl font-bold mb-4">🛠️ Tech Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="font-semibold text-sm text-blue-900">
              Audio Processing
            </div>
            <div className="text-xs text-blue-700 mt-1">Web Audio API</div>
          </div>
          <div>
            <div className="font-semibold text-sm text-blue-900">
              Animations
            </div>
            <div className="text-xs text-blue-700 mt-1">
              React Spring + Framer
            </div>
          </div>
          <div>
            <div className="font-semibold text-sm text-blue-900">Storage</div>
            <div className="text-xs text-blue-700 mt-1">Cloudinary</div>
          </div>
          <div>
            <div className="font-semibold text-sm text-blue-900">Database</div>
            <div className="text-xs text-blue-700 mt-1">Convex</div>
          </div>
        </div>
      </motion.div>

      {/* Code Example */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-4xl mx-auto bg-white rounded-2xl p-8 border border-gray-200 mb-8"
      >
        <h2 className="text-2xl font-bold mb-4">💻 Usage Example</h2>
        <p className="text-gray-600 mb-4">
          Open the modal and record a voice confession:
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
          {`<VoiceConfessModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  category="regret"
  onSuccess={() => console.log('Confession recorded!')}
/>`}
        </pre>
      </motion.div>

      {/* Success Message */}
      {submittedConfession && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-4xl mx-auto bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-green-900">
                ✨ Confession Recorded!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Your voice confession has been uploaded and will appear in the
                feed.
              </p>
            </div>
            <button
              onClick={() => setSubmittedConfession(false)}
              className="text-green-600 hover:text-green-900"
            >
              <X size={24} />
            </button>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="max-w-4xl mx-auto text-center"
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg rounded-xl hover:shadow-lg transition-all hover:scale-105"
        >
          <Mic size={24} />
          Start Recording Now
        </button>
      </motion.div>

      {/* Modal */}
      <VoiceConfessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          setSubmittedConfession(true);
          setTimeout(() => setSubmittedConfession(false), 4000);
        }}
      />
    </div>
  );
}
