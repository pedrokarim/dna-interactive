"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const NEW_CHARACTERS = [
  { id: "char-zhiliu", name: "Zhiliu", avatar: "/assets/characters/gacha/T_Gacha_AvatarZhiliu.png" },
  { id: "char-yuming", name: "Yuming", avatar: "/assets/characters/gacha/T_Gacha_AvatarYuming.png" },
  { id: "char-suyi", name: "Su Yi", avatar: "/assets/characters/gacha/T_Gacha_AvatarSuyi.png" },
  { id: "char-kami", name: "Camilla", avatar: "/assets/characters/gacha/T_Gacha_AvatarKami.png" },
];

export default function NewCharactersBanner() {
  return (
    <section className="py-10">
      <div className="container mx-auto px-6">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-800/60 via-indigo-900/30 to-slate-900/60 backdrop-blur-sm border border-indigo-500/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-full mb-4"
            >
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span className="text-sm font-semibold text-indigo-200">Nouveaux personnages</span>
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Derniers arrivants
            </h2>
          </div>

          {/* Characters grid */}
          <div className="flex justify-center gap-6 md:gap-10 flex-wrap">
            {NEW_CHARACTERS.map((character, index) => (
              <Link key={character.id} href={`/characters/${character.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center gap-3 group"
                >
                  <motion.div
                    animate={{
                      rotate: [0, -2, 2, -1.5, 1.5, -0.5, 0.5, 0],
                      x: [0, -1, 1, -1, 1, -0.5, 0.5, 0],
                    }}
                    transition={{
                      duration: 0.8,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 4 + index * 0.7,
                    }}
                    className="relative"
                  >
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 border-indigo-500/40 group-hover:border-indigo-400/80 transition-colors duration-300 bg-slate-800/50">
                      <Image
                        src={character.avatar}
                        alt={character.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-xl bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-colors duration-300" />
                  </motion.div>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-indigo-300 transition-colors duration-300">
                    {character.name}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
