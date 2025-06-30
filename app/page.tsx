'use client'

import {useCallback, useEffect, useRef, useState} from "react";
import {useDropzone} from "react-dropzone";
import {FastForward, Pause, Play, Rewind, SkipBack} from "lucide-react";
import { parseWebStream } from 'music-metadata';
import WaveSurfer from "wavesurfer.js";

export default function Home() {
    const waveformRef = useRef<HTMLDivElement>(null);
    const [waveSurfer, setWaveSurfer] = useState<WaveSurfer | null>(null);
    const [hasFile, setHasFile] = useState(false);
    const [audioMetadata, setAudioMetadata] = useState<{
        title?: string;
        artist?: string;
        album?: string;
        pictureUrl?: string;
    } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [events] = useState([
        { id: 1, name: 'Red Event', color: 'bg-red-500' },
        { id: 2, name: 'Blue Event', color: 'bg-blue-500' },
        { id: 3, name: 'Green Event', color: 'bg-green-500' },
    ]);

    useEffect(() => {
        if (!waveformRef.current) return;

        const ws = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#999',
            progressColor: '#555',
            cursorColor: '#333',
            height: 100,
        });

        ws.on('finish', () => {
            setIsPlaying(false);
        });

        setWaveSurfer(ws);

        return () => {
            ws.destroy();
        };
    }, []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!waveSurfer || acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        waveSurfer.loadBlob(file);

        try {
            const objectUrl = URL.createObjectURL(file);
            const response = await fetch(objectUrl);
            const stream = response.body;

            if (!stream) throw new Error("Failed to get readable stream from file");

            const metadata = await parseWebStream(stream, file.type);
            const common = metadata.common;

            const fallbackTitle = file.name.replace(/\.[^/.]+$/, '');

            let pictureUrl: string | undefined = undefined;
            if (common.picture && common.picture.length > 0) {
                const pic = common.picture[0];
                const blob = new Blob([pic.data], { type: pic.format });
                pictureUrl = URL.createObjectURL(blob);
            }

            setAudioMetadata({
                title: common.title || fallbackTitle,
                artist: common.artist,
                album: common.album,
                pictureUrl,
            });

            URL.revokeObjectURL(objectUrl);
        } catch (err) {
            console.error("Metadata read error:", err);
            setAudioMetadata({
                title: file.name.replace(/\.[^/.]+$/, ''),
                artist: 'Unknown Artist',
                album: 'Unknown Album',
            });
        }

        waveSurfer.once('decode', () => {
            setHasFile(true);
        });
    }, [waveSurfer]);

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true,
        accept: {'audio/*': []},
        multiple: false,
    });

    return (
        <div className="p-4 flex flex-row gap-2 w-dvw h-dvh">
            <div className="flex flex-col gap-2 w-2/3">
                <div className="flex flex-row gap-2 items-center">
                    <div className="flex flex-row gap-2 items-center shrink-0">
                        <img
                            className="w-16 aspect-square object-cover rounded"
                            src={audioMetadata?.pictureUrl || "https://placehold.co/400"}
                            alt={audioMetadata?.album}
                        />
                        <div className="flex flex-col">
                            <div className="font-bold">{audioMetadata?.title || 'Unknown Title'}</div>
                            <div className="text-sm">{audioMetadata?.artist || 'Unknown Artist'}</div>
                        </div>
                    </div>
                    <div className="flex flex-row gap-2 justify-end flex-1">
                        <span><SkipBack/></span>
                        <span><Rewind/></span>
                        <span><FastForward/></span>
                        <span
                            onClick={() => {
                                if (!waveSurfer) return;
                                if (waveSurfer.isPlaying()) {
                                    waveSurfer.pause();
                                    setIsPlaying(false);
                                } else {
                                    waveSurfer.play();
                                    setIsPlaying(true);
                                }
                            }}
                            className="cursor-pointer"
                        >
        {isPlaying ? <Pause /> : <Play />}
    </span>
                    </div>
                </div>

                <div {...getRootProps()} className={`rounded border-2 transition-colors h-[100px] relative ${
                    isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-100'
                } ${hasFile ? 'border-solid' : 'border-dashed'}`}>
                    <input {...getInputProps()} />
                    {!hasFile && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-600 pointer-events-none">
                            {isDragActive ? 'Drop the audio here!' : 'Drag and drop an audio file'}
                        </div>
                    )}
                    <div ref={waveformRef} className="w-full h-full" />
                </div>

                <div className="bg-slate-100 rounded flex-1 p-2 flex flex-col gap-2">
                    <div className="bg-red-500">Item</div>
                </div>
            </div>
            <div className="flex flex-col w-1/3 overflow-y-auto">
                {events.map(event => (
                    <div key={event.id} className="p-2 flex flex-row gap-2 items-center hover:bg-slate-100 w-full">
                        <div className={`aspect-square h-4 rounded ${event.color}`}></div>
                        <div className="text-sm">{event.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}