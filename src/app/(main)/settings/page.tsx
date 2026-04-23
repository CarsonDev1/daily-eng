'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Settings, Key, Database, Sparkles } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        Settings
      </h1>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="w-4 h-4" />
            API Keys
          </CardTitle>
          <CardDescription>
            Keys are stored in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env.local</code> — never commit this file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EnvRow
            label="ANTHROPIC_API_KEY"
            description="Used to generate vocabulary words and writing topics via Claude"
            icon={<Sparkles className="w-4 h-4 text-purple-500" />}
          />
          <Separator />
          <EnvRow
            label="NEXT_PUBLIC_SUPABASE_URL"
            description="Your Supabase project URL"
            icon={<Database className="w-4 h-4 text-green-500" />}
          />
          <Separator />
          <EnvRow
            label="NEXT_PUBLIC_SUPABASE_ANON_KEY"
            description="Supabase anon (public) key for client-side queries"
            icon={<Database className="w-4 h-4 text-green-500" />}
          />
        </CardContent>
      </Card>

      {/* Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600">
          <Step number={1} title="Supabase">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to <strong>supabase.com</strong> → create a new project</li>
              <li>Open <strong>SQL Editor</strong> → paste and run <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">supabase-schema.sql</code></li>
              <li>Copy your Project URL and anon key from <strong>Project Settings → API</strong></li>
              <li>Paste into <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env.local</code></li>
            </ol>
          </Step>

          <Separator />

          <Step number={2} title="Claude API (Anthropic)">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to <strong>console.anthropic.com</strong></li>
              <li>Create an API key</li>
              <li>Add it as <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">ANTHROPIC_API_KEY</code> in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env.local</code></li>
            </ol>
          </Step>

          <Separator />

          <Step number={3} title="Run the app">
            <code className="bg-gray-900 text-green-400 px-4 py-2 rounded-lg text-sm block font-mono">
              npm run dev
            </code>
          </Step>
        </CardContent>
      </Card>

      {/* App info */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Daily English App</p>
              <p className="text-xs text-gray-400">Built with Next.js 14 · Supabase · Claude API</p>
            </div>
            <Badge variant="outline">v1.0.0</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EnvRow({ label, description, icon }: { label: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <Label className="font-mono text-sm">{label}</Label>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <Badge variant="secondary" className="text-xs shrink-0">env.local</Badge>
    </div>
  )
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
          {number}
        </span>
        <span className="font-semibold text-gray-800">{title}</span>
      </div>
      <div className="ml-7">{children}</div>
    </div>
  )
}
