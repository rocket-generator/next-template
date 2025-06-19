import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'
import { NextIntlClientProvider } from 'next-intl'
import React from 'react'

// Import messages
import jaMessages from '../messages/ja.json'
import enMessages from '../messages/en.json'

const messages = {
  ja: jaMessages,
  en: enMessages,
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  
  decorators: [
    (Story) => (
      <NextIntlClientProvider 
        locale="ja" 
        messages={messages.ja}
        timeZone="Asia/Tokyo"
      >
        <Story />
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;