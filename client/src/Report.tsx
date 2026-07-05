import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { ListPages } from "./types";

export default function ReportPage({ onViewChange }: { onViewChange: React.Dispatch<React.SetStateAction<number>> }) {
    const [mdContent, setMdContent] = useState<string>("Loading report content . . .");
    useEffect(() => {
        fetch("https://logi-stack-svr.vercel.app/Report").then((res) => res.text()).then((text) => setMdContent(text)).catch(() => setMdContent('Failed to parse report file from workspace root.'));
    }, []);

    return (
        <>
            <div className="absolute right-2 top-2 flex flex-row text-slate-500 hover:text-slate-800">
                <ArrowLeft />
                <button onClick={() => { onViewChange(ListPages.Dashboard) }} className="flex items-center gap-1.5 text-xs transition-colors cursor-pointer">
                    Back to Dashboard
                </button>
            </div>

            <div className="mt-[2%] ms-[3%]">
                <Markdown>
                    {mdContent}
                </Markdown>
            </div>
        </>
    );
}