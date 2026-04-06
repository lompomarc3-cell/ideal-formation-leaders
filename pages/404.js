import Head from 'next/head'

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page introuvable - IFL</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center px-4">
        <div className="text-center text-white">
          <div className="text-8xl font-bold mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2">Page introuvable</h1>
          <p className="text-blue-200 mb-8">Cette page n'existe pas ou a été déplacée.</p>
          <a href="/" className="btn-primary inline-block">
            Retour à l'accueil
          </a>
        </div>
      </div>
    </>
  )
}
