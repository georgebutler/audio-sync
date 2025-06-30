'use client'
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useDropzone } from 'react-dropzone';
import { Pause, Play, Square, RotateCcw, Upload } from 'lucide-react';

export default function Home() {
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const [fileLoaded, setFileLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [fileName, setFileName] = useState('');

    useEffect(() => {
        if (waveformRef.current && !wavesurferRef.current) {
            wavesurferRef.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#6366f1',
                progressColor: '#4f46e5',
                cursorColor: '#a78bfa',
                barWidth: 2,
                barRadius: 3,
                responsive: true,
                height: 80,
                normalize: true,
                backend: 'WebAudio',
                mediaControls: false,
            });

            wavesurferRef.current.on('finish', () => {
                setIsPlaying(false);
            });

            wavesurferRef.current.on('ready', () => {
                setDuration(wavesurferRef.current.getDuration());
            });

            wavesurferRef.current.on('audioprocess', () => {
                setCurrentTime(wavesurferRef.current.getCurrentTime());
            });

            wavesurferRef.current.on('seek', () => {
                setCurrentTime(wavesurferRef.current.getCurrentTime());
            });
        }
    }, []);

    const togglePlay = () => {
        if (wavesurferRef.current && fileLoaded) {
            wavesurferRef.current.playPause();
            setIsPlaying(wavesurferRef.current.isPlaying());
        }
    };

    const stopAudio = () => {
        if (wavesurferRef.current && fileLoaded) {
            wavesurferRef.current.stop();
            setIsPlaying(false);
            setCurrentTime(0);
        }
    };

    const restartAudio = () => {
        if (wavesurferRef.current && fileLoaded) {
            wavesurferRef.current.seekTo(0);
            setCurrentTime(0);
            if (isPlaying) {
                wavesurferRef.current.play();
            }
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && fileLoaded) {
                e.preventDefault();
                togglePlay();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fileLoaded]);

    const onDrop = (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file && file.type.startsWith('audio/') && wavesurferRef.current) {
            const objectUrl = URL.createObjectURL(file);
            wavesurferRef.current.load(objectUrl);
            setFileLoaded(true);
            setIsPlaying(false);
            setFileName(file.name);
            setCurrentTime(0);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'audio/*': [] },
        noClick: true,
        noKeyboard: true,
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            <div className="container mx-auto px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                            Audio Waveform Editor
                        </h1>
                        <p className="text-gray-400">Create and edit JSON events along your audio timeline</p>
                    </div>

                    <div
                        {...getRootProps()}
                        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
                            isDragActive
                                ? 'border-indigo-400 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                                : 'border-gray-600 bg-gray-800/50 backdrop-blur-sm'
                        }`}
                    >
                        <input {...getInputProps()} />

                        <div className="p-8">
                            {!fileLoaded ? (
                                <div className="text-center py-12">
                                    <div className="mb-6">
                                        <Upload className="mx-auto h-16 w-16 text-gray-500 mb-4" />
                                        <h3 className="text-xl font-semibold text-gray-300 mb-2">
                                            {isDragActive ? 'Drop your audio file here' : 'Drag & drop an audio file'}
                                        </h3>
                                        <p className="text-gray-500">
                                            Support for MP3, WAV, FLAC, and other audio formats
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold text-white mb-1">{fileName}</h2>
                                        <p className="text-gray-400">Ready for editing</p>
                                    </div>

                                    <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
                                        <div id="waveform" ref={waveformRef} className="mb-6" />

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <button
                                                    onClick={togglePlay}
                                                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                                                >
                                                    {isPlaying ? (
                                                        <>
                                                            <Pause size={20} />
                                                            <span className="font-medium">Pause</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play size={20} />
                                                            <span className="font-medium">Play</span>
                                                        </>
                                                    )}
                                                </button>

                                                <button
                                                    onClick={stopAudio}
                                                    className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-all duration-200"
                                                >
                                                    <Square size={18} />
                                                    <span className="font-medium">Stop</span>
                                                </button>

                                                <button
                                                    onClick={restartAudio}
                                                    className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-all duration-200"
                                                >
                                                    <RotateCcw size={18} />
                                                    <span className="font-medium">Restart</span>
                                                </button>
                                            </div>

                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <div className="text-lg font-mono text-white">
                                                        {formatTime(currentTime)} / {formatTime(duration)}
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Space</kbd> to play/pause
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                    </div>

                    {fileLoaded && (
                        <div className="mt-8 text-center">
                            <p className="text-gray-500 text-sm">
                                Your audio file is loaded and ready. Start adding JSON events to create your timeline.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}