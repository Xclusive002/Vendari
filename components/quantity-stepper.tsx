'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Check, X } from 'lucide-react'

interface QuantityStepperProps {
	initialQuantity?: number
	minQuantity?: number
	maxQuantity?: number
	onConfirm: (quantity: number) => void
	onCancel: () => void
	confirmLabel?: string
	isLoading?: boolean
}

/**
 * QuantityStepper
 *
 * Reusable inline quantity selector with +/- buttons.
 * Used in Quick Sale and Quick Restock modes.
 */
export function QuantityStepper({
	initialQuantity = 1,
	minQuantity = 1,
	maxQuantity = 999,
	onConfirm,
	onCancel,
	confirmLabel = 'Confirm',
	isLoading = false,
}: QuantityStepperProps) {
	const [quantity, setQuantity] = useState(initialQuantity)

	const handleDecrement = () => {
		if (quantity > minQuantity) {
			setQuantity(quantity - 1)
		}
	}

	const handleIncrement = () => {
		if (quantity < maxQuantity) {
			setQuantity(quantity + 1)
		}
	}

	const handleConfirm = () => {
		onConfirm(quantity)
	}

	return (
		<div className="flex items-center gap-3 bg-slate-700/50 p-4 rounded-lg border border-slate-600">
			<Button
				type="button"
				onClick={handleDecrement}
				disabled={quantity <= minQuantity || isLoading}
				variant="ghost"
				size="sm"
				className="h-10 w-10 p-0 hover:bg-slate-600"
				title="Decrease quantity"
			>
				<Minus className="w-4 h-4" />
			</Button>

			<div className="flex-1 text-center">
				<div className="text-2xl font-semibold text-ink">{quantity}</div>
				<div className="text-xs text-text-muted">units</div>
			</div>

			<Button
				type="button"
				onClick={handleIncrement}
				disabled={quantity >= maxQuantity || isLoading}
				variant="ghost"
				size="sm"
				className="h-10 w-10 p-0 hover:bg-slate-600"
				title="Increase quantity"
			>
				<Plus className="w-4 h-4" />
			</Button>

			<div className="flex gap-2">
				<Button
					type="button"
					onClick={handleConfirm}
					disabled={isLoading}
					className="dashboard-primary flex items-center gap-2"
					size="sm"
				>
					{isLoading ? (
						<>
							<div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
							Processing...
						</>
					) : (
						<>
							<Check className="w-4 h-4" />
							{confirmLabel}
						</>
					)}
				</Button>
				<Button
					type="button"
					onClick={onCancel}
					disabled={isLoading}
					variant="ghost"
					size="sm"
					className="text-text-secondary hover:bg-slate-600"
				>
					<X className="w-4 h-4" />
				</Button>
			</div>
		</div>
	)
}
