import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Divider from '../components/ui/Divider'

const LandingPage = () => {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--theme-accent)]">TapLink Platform</p>
        <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-tight text-[var(--theme-text)] sm:text-5xl md:text-6xl">
          NFC-powered profile pages with premium themed experiences
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base text-[var(--theme-muted)] sm:text-lg">
          Choose a template, customize your details, pick a theme, and share instantly. TapLink keeps your link-based profile
          clean, responsive, and private-by-link.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/claim/DEMO-1234">
            <Button className="w-56">Activate Your Tag</Button>
          </Link>
          <Link to="/p/demo-public-id">
            <Button variant="outline" className="w-56">View Demo Profile</Button>
          </Link>
        </div>
      </section>

      <Divider />

      <section>
        <h2 className="mb-6 text-center text-3xl font-semibold text-[var(--theme-text)]">How it works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Scan or Tap',
              body: 'Users scan the QR or tap the NFC tag to open your page instantly.',
              icon: '①',
            },
            {
              title: 'Build Fast',
              body: 'Pick a template and fill in details using a live mobile preview editor.',
              icon: '②',
            },
            {
              title: 'Share Smarter',
              body: 'Your themed profile is optimized for mobile and polished for real usage.',
              icon: '③',
            },
          ].map((item) => (
            <Card key={item.title} hoverable>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--theme-accent)_18%,white)] font-semibold text-[var(--theme-accent)]">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-[var(--theme-text)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--theme-muted)]">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <Divider />

      <section>
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--theme-accent)]">Preview Instantly</p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--theme-text)]">Demo Profiles</h2>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">
            Open fully populated examples for each template.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Personal', to: '/p/demo-public-id', description: 'Individual creator profile demo' },
            { title: 'Business', to: '/p/demo-business-public-id', description: 'Service business profile demo' },
            { title: 'Pet', to: '/p/demo-pet-public-id', description: 'Pet safety and contact profile demo' },
            { title: 'Restaurant', to: '/p/demo-restaurant-public-id', description: 'Cafe menu profile demo' },
          ].map((demo) => (
            <Card key={demo.to} hoverable className="flex h-full flex-col">
              <h3 className="text-lg font-semibold text-[var(--theme-text)]">{demo.title}</h3>
              <p className="mt-2 flex-1 text-sm text-[var(--theme-muted)]">{demo.description}</p>
              <Link to={demo.to} className="mt-4">
                <Button variant="outline" className="w-full">Open Demo</Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

export default LandingPage
