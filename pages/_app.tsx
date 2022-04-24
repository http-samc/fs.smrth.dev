import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { GeistProvider, CssBaseline, Link, Divider, Page, Text, Loading, Spacer, Button } from '@geist-ui/core'
import Head from 'next/head'
import Script from 'next/script'
import Cookies from 'js-cookie'
import '../styles/globals.css'
import { Moon, Sun } from '@geist-ui/icons'
import Auth from '../components/auth'

const App = ({ Component, pageProps, router }: AppProps) => {
  const [host, setHost] = useState('')
  const [theme, setTheme] = useState('light')
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const toggleTheme = () => {
    let newTheme = theme === 'light' ? 'dark' : 'light'
    window.localStorage.setItem('theme', newTheme)
    setTheme(newTheme)
  }

  const signOut = () => {
    fetch('/api/auth', {
      method: 'DELETE'
    })
    Cookies.set('authorization', '')
    setIsAuthenticated(false)
  }

  useEffect(() => {
    setLoading(true)
    setHost(window.location.host)
    if (!Cookies.get('authorization')) {
      setIsAuthenticated(false)
    }
    else {
      setIsAuthenticated(true)
    }

    const localTheme = window.localStorage.getItem('theme')
    if (localTheme)
      setTheme(localTheme)
    else {
      window.localStorage.setItem(
        'theme',
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      )
    }
    setLoading(false)

  }, [isAuthenticated])


  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100vh',
        backgroundColor: theme == 'light' ? 'white' : 'black'
      }}>
        <Loading type='success' />
      </div>
    )
  }


  return (
    <GeistProvider themeType={theme}>
      <CssBaseline />
      <Head>
        <title>{host}</title>
        <meta name="title" content="fs.smrth.dev" />
        <meta name="description" content="Sam Chitgopekar's filesystem." />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://fs.smrth.dev/${router.pathname}`} />
        <meta property="og:title" content="fs.smrth.dev" />
        <meta property="og:description" content="Sam Chitgopekar's filesystem." />
        <meta property="og:image" content="https://avatars.githubusercontent.com/u/67826352?s=500" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`https://fs.smrth.dev/${router.pathname}`} />
        <meta property="twitter:title" content="fs.smrth.dev" />
        <meta property="twitter:description" content="Sam Chitgopekar's filesystem." />
        <meta property="twitter:image" content="https://avatars.githubusercontent.com/u/67826352?s=500" />
      </Head>
      <Page id="page" dotBackdrop={false} dotSize="2px" style={{ padding: 20, marginTop: -30 }}>
        <Page.Header>
          <div className='header-container'>
            <Link href='/'>
              <Text h2 type="success">{host}</Text>
            </Link>
            <div className='header-options'>
              {isAuthenticated && <Button auto style={{ marginRight: 10 }} onClick={signOut}>Sign Out</Button>}
              <Button
                onClick={toggleTheme}
                auto
                className='theme-toggle'
                icon={
                  theme == 'light'
                    ? <Moon color='purple' />
                    : <Sun color='yellow' />
                }
              />
            </div>
          </div>
        </Page.Header>
        <Divider />
        {
          isAuthenticated
            ? <Component {...pageProps} theme={theme} />
            : <Auth onAuthFinished={() => setIsAuthenticated(true)} />

        }
        <Spacer />
        <Page.Footer id='footer'>
          <Divider />
          <Text id='masthead' style={{ textAlign: 'center' }}>
            Lost? Go to <Link style={{ color: '#0070f3' }} href='/'>smrth.dev</Link>.
          </Text>
        </Page.Footer>
      </Page >
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-HLVQ3LXHS2"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-HLVQ3LXHS2');
        `}
      </Script>
    </GeistProvider >
  )
}

export default App