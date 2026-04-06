import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ListOrdered, Users, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center">
          <span className="font-bold text-xl tracking-tight text-primary">JokiSystem.</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Masuk
          </Link>
          <Link href="/register">
            <Button className="rounded-full shadow-md hover:shadow-lg transition-all">Mulai Gratis</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-16 md:py-24 lg:py-32 xl:py-40 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-b">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
                  Manajemen Joki Game Lebih Profesional
                </h1>
                <p className="mx-auto max-w-[700px] text-slate-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-slate-400">
                  Tinggalkan Excel dan WhatsApp manual. Kelola antrean, pantau worker, dan bagikan link status antrean publik ke customer Anda secara real-time.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    Mulai Sekarang <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 md:py-24 lg:py-32 bg-white dark:bg-slate-900">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group flex flex-col items-center space-y-6 text-center p-6 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <ListOrdered className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Public Queue Link</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Bagikan URL unik ke customer agar mereka bisa memantau nomor antrean tanpa perlu bertanya terus menerus.
                  </p>
                </div>
              </div>
              <div className="group flex flex-col items-center space-y-6 text-center p-6 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <Users className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Kelola Worker</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tugaskan order spesifik ke worker Anda dan pantau beban kerja masing-masing secara transparan.
                  </p>
                </div>
              </div>
              <div className="group flex flex-col items-center space-y-6 text-center p-6 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <Zap className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Real-time Status</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Pembaruan status secara otomatis kepada pelanggan menggunakan teknologi WebSockets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-8 w-full shrink-0 items-center justify-center px-4 md:px-6 border-t bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          © 2026 JokiSystem. Built for professional owners.
        </p>
      </footer>
    </div>
  );
}
