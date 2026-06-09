import type { Preview, Decorator } from '@storybook/nextjs-vite'
import React from 'react'
import '../src/app/globals.css'
import './dna-fonts.css'
import { dnaTheme } from './theme'

const withDnaBackground: Decorator = (Story) => (
  <div className="dna-sb-canvas">
    <Story />
  </div>
)

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: { disable: true }, // le fond DNA est fourni par le décorateur
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: { test: 'todo' },
    docs: { toc: true, theme: dnaTheme },
  },
  decorators: [withDnaBackground],
}

export default preview
