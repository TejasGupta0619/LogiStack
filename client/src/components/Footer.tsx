/**
 * @file Footer.tsx
 * 
 * Footer Component */
import { motion } from 'framer-motion';
import {
    createLucideIcon,
    Code2,
    Layers,
    Zap,
    Shield,
    Radio,
    ExternalLink,
    NotebookTabs,
    type LucideIcon,
} from 'lucide-react';


/**
 * Github icon
 * Lucid custom icon
 *
 * @type {LucideIcon}
 */
export const Github: LucideIcon = createLucideIcon('Github', [
    ['path', { d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4', key: 'github-path-1' }],
    ['path', { d: 'M9 18c-4.51 2-5-2-7-2', key: 'github-path-2' }]
]);

/**
 * Linked icon
 * Lucid custom icon
 * 
 * @type {LucideIcon}
 */
export const Linkedin: LucideIcon = createLucideIcon('Linkedin', [
    ['path', { d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z', key: 'linkedin-path-1' }],
    ['rect', { x: '2', y: '9', width: '4', height: '12', key: 'linkedin-rect-1' }],
    ['circle', { cx: '4', cy: '4', r: '2', key: 'linkedin-circle-1' }]
]);


/**
 * TECH_STACK array
 * contains used tech stack
 * with styles
 */
const TECH_STACK = [
    { label: 'React 19', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    { label: 'TypeScript', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Framer Motion', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: 'dnd-kit', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { label: 'Node.js', color: 'bg-green-50 text-green-700 border-green-200' },
    { label: 'Express', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    { label: 'SSE', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { label: 'Tailwind CSS', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { label: 'Vite', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
] as const;


/**
 * Features array
 */
const FEATURES = [
    { icon: Zap, label: 'Optimistic UI' },
    { icon: Shield, label: 'Mutex Race Protection' },
    { icon: Radio, label: 'Real-time SSE Sync' },
    { icon: Layers, label: 'Drag & Drop + Rollback' },
] as const;


/**
 * Footer component
 *
 * @export
 * @returns {React.JSX.Element} 
 */
export default function Footer() {
    return (
        <footer className="mt-auto border-t border-slate-200 bg-white">
            {/* Main div */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

                {/*  Top Row  */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-8">

                    {/* Left: Project identity */}
                    <div className="flex-1 max-w-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
                                <Code2 className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-slate-900 tracking-tight">
                                Operational Warp
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            A full-stack logistics dispatch dashboard built as part of a
                            BairesDev interview challenge - demonstrating optimistic UI,
                            real-time multi-client synchronization, and server-side
                            mutex-based race condition handling.
                        </p>

                        {/* Challenge badge */}
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-semibold tracking-wide">
                            <Zap className="w-3 h-3 text-yellow-400" />
                            BairesDev Full-Stack Challenge
                        </div>
                    </div>

                    {/* Center: Key features */}
                    <div className="flex-1">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                            Key Implementations
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {FEATURES.map(({ icon: Icon, label }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-2 text-xs text-slate-600"
                                >
                                    <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                                        <Icon className="w-3 h-3 text-slate-500" />
                                    </div>
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Candidate card */}
                    <div className="shrink-0">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                            Candidate
                        </p>

                        <motion.div
                            whileHover={{ y: -1 }}
                            transition={{ duration: 0.15 }}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-4 pr-1 w-fit"
                        >
                            {/* Avatar placeholder + name */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-full bg-linear-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    TG
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 leading-tight">
                                        Tejas Gupta
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        Full-Stack Engineer
                                    </p>
                                </div>
                            </div>

                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                Passionate about building data driven,
                            </p>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                event driven, real-time interfaces with
                            </p>
                            <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                                clean architecture.
                            </p>

                            {/* Social links */}
                            <div className="flex items-center gap-2">
                                <a
                                    href="https://github.com/TejasGupta0619"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-900 transition-colors group"
                                >
                                    <Github className="w-3.5 h-3.5" />
                                    <span className="group-hover:underline">GitHub</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>

                                <span className="text-slate-200">|</span>

                                <a
                                    href="https://www.linkedin.com/in/tejas-gupta-320254299/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-blue-600 transition-colors group"
                                >
                                    <Linkedin className="w-3.5 h-3.5" />
                                    <span className="group-hover:underline">LinkedIn</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>

                                <span className="text-slate-200">|</span>

                                <a
                                    href="/Report"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-900 transition-colors group">
                                    <NotebookTabs className="w-3.5 h-3.5" />
                                    <span className="group-hover:underline">Full Report</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/*  Tech Stack Row  */}
                <div className="border-t border-slate-100 pt-6 mb-6">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                        Built With
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {TECH_STACK.map(({ label, color }) => (
                            <span
                                key={label}
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${color}`}
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                </div>

                {/*  Bottom Bar  */}
                <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span>
                        Built for{' '}
                        <span className="font-semibold text-slate-600">
                            BairesDev Full-Stack Engineer Assessment
                        </span>
                        {' '}· {new Date().getFullYear()}
                    </span>

                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>
                            In-memory state · No database · Custom mutex · SSE broadcast
                        </span>
                    </div>
                </div>

            </div>
        </footer>
    );
}