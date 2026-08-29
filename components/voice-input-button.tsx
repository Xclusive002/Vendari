'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, StopCircle } from 'lucide-react'
import { toast } from 'sonner'

interface VoiceInputButtonProps {
	context: 'sale' | 'inventory'
	businessId: string
	onExtracted: (data: any) => void
	className?: string
}

/**
 * VoiceInputButton
 *
 * Records audio and sends it to the backend voice-entry endpoint for Gemini processing.
 * Extracts structured data (product name, quantity, prices) and returns via callback.
 *
 * Usage:
 * <VoiceInputButton
 *   context="sale"
 *   businessId={business.id}
 *   onExtracted={(data) => setFormData({ ...formData, ...data })}
 * />
 */
export function VoiceInputButton({
	context,
	businessId,
	onExtracted,
	className = '',
}: VoiceInputButtonProps) {
	const [isRecording, setIsRecording] = useState(false)
	const [isProcessing, setIsProcessing] = useState(false)
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const audioChunksRef = useRef<Blob[]>([])

	const startRecording = async () => {
		try {
			// Request microphone access
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

			// Create MediaRecorder
			const mediaRecorder = new MediaRecorder(stream)
			mediaRecorderRef.current = mediaRecorder
			audioChunksRef.current = []

			// Collect audio chunks
			mediaRecorder.ondataavailable = (event) => {
				audioChunksRef.current.push(event.data)
			}

			// Handle recording stop
			mediaRecorder.onstop = async () => {
				// Stop all tracks (release microphone)
				stream.getTracks().forEach((track) => track.stop())

				// Create audio blob
				const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })

				// Send to backend
				await sendAudioToBackend(audioBlob)
			}

			mediaRecorder.start()
			setIsRecording(true)
			toast.info('Recording... Click again to stop', { duration: 2 })
		} catch (error) {
			console.error('[VoiceInput] Microphone access denied:', error)
			toast.error('Microphone access denied. Please check your permissions.')
		}
	}

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop()
			setIsRecording(false)
		}
	}

	const sendAudioToBackend = async (audioBlob: Blob) => {
		setIsProcessing(true)
		try {
			const formData = new FormData()
			formData.append('audio', audioBlob, 'audio.wav')
			formData.append('context', context)

			const response = await fetch(
				`/api/businesses/${businessId}/voice-entry/`,
				{
					method: 'POST',
					body: formData,
				}
			)

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`)
			}

			const data = await response.json()

			// Check for extraction errors
			if (data.error) {
				toast.error(`Voice entry: ${data.error}`)
				return
			}

			// Success: Call the callback with extracted data
			onExtracted(data)
			toast.success('Voice entry successful! Form fields pre-filled.')
		} catch (error) {
			console.error('[VoiceInput] Error:', error)
			toast.error('Failed to process voice entry. Please try again.')
		} finally {
			setIsProcessing(false)
		}
	}

	const handleClick = () => {
		if (isRecording) {
			stopRecording()
		} else {
			startRecording()
		}
	}

	return (
		<Button
			type="button"
			onClick={handleClick}
			disabled={isProcessing}
			variant="outline"
			size="sm"
			className={`flex items-center gap-2 ${isRecording ? 'bg-red-500/20 border-red-500' : ''} ${className}`}
			title={isRecording ? 'Click to stop recording' : 'Click to start recording voice entry'}
		>
			{isProcessing ? (
				<>
					<div className="w-4 h-4 border-2 border-slate-400 border-t-blue rounded-full animate-spin" />
					Processing...
				</>
			) : isRecording ? (
				<>
					<StopCircle className="w-4 h-4 text-red-500" />
					Stop Recording
				</>
			) : (
				<>
					<Mic className="w-4 h-4" />
					Voice Entry
				</>
			)}
		</Button>
	)
}
