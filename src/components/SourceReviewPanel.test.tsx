// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { SourceReviewPanel } from './SourceReviewPanel'
import { SOURCE_REVIEWS } from '../lib/sourceReview'
afterEach(cleanup)
it('covers all seven themes and keeps reviewed references distinct from integrated data', () => {
  expect(new Set(SOURCE_REVIEWS.map(r => r.themeId)).size).toBe(7)
  for (const review of SOURCE_REVIEWS) {
    render(<SourceReviewPanel themeId={review.themeId} />)
    expect(screen.getByText(/Regra de comparação/)).toBeInTheDocument()
    expect(screen.getByText(/Melhoria ainda necessária/)).toBeInTheDocument()
    expect(review.sources.some(s => s.scale.startsWith('Nacional'))).toBe(true)
    expect(review.sources.some(s => s.scale.startsWith('Regional'))).toBe(true)
    expect(review.sources.some(s => s.scale.startsWith('Mundial'))).toBe(true)
    cleanup()
  }
})
