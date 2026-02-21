import TemplateCard from '../components/TemplateCard'
import { CardSkeleton } from '../components/ui/LoadingSkeleton'

const Templates = () => {
  const petPreview = <CardSkeleton />
  const businessPreview = <CardSkeleton />
  const personalPreview = <CardSkeleton />
  const restaurantPreview = <CardSkeleton />

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--theme-accent)]">Template Gallery</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--theme-text)] sm:text-4xl">Choose your starting point</h1>
        <p className="mx-auto mt-3 max-w-2xl text-[var(--theme-muted)]">
          Every template is mobile-first and tuned for instant readability after a scan.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <TemplateCard templateType="pet" preview={petPreview} />
        <TemplateCard templateType="business" preview={businessPreview} />
        <TemplateCard templateType="personal" preview={personalPreview} />
        <TemplateCard templateType="restaurant" preview={restaurantPreview} />
      </div>
    </div>
  )
}

export default Templates
