import { Link } from 'react-router-dom'
import { TemplateType } from '../types'
import Button from './ui/Button'
import Card from './ui/Card'

interface TemplateCardProps {
  templateType: TemplateType
  preview: React.ReactNode
}

const templateInfo = {
  pet: {
    title: 'Pet Profile',
    description: "Keep your pet's information accessible in case of emergency",
    icon: '🐾',
  },
  business: {
    title: 'Business Profile',
    description: 'Share your business information with customers instantly',
    icon: '💼',
  },
  personal: {
    title: 'Personal Contact',
    description: 'Share your contact info and portfolio with others',
    icon: '👤',
  },
  restaurant: {
    title: 'Restaurant Menu',
    description: 'Display your menu and restaurant information',
    icon: '🍽️',
  },
}

const TemplateCard = ({ templateType, preview }: TemplateCardProps) => {
  const info = templateInfo[templateType]

  return (
    <Card hoverable className="group flex h-full flex-col">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-3xl">{info.icon}</span>
        <h3 className="text-lg font-semibold text-[var(--theme-text)]">{info.title}</h3>
      </div>

      <p className="mb-4 text-sm text-[var(--theme-muted)]">{info.description}</p>

      <div className="mb-5 rounded-2xl border border-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--theme-card)_90%,white)] p-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--theme-muted)]">Preview</div>
        {preview}
      </div>

      <Link to={`/editor/${templateType}`} className="mt-auto block">
        <Button className="w-full">Use Template</Button>
      </Link>
    </Card>
  )
}

export default TemplateCard
