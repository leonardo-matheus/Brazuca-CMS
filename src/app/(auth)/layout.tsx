import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeSwitch';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-dark-950">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Theme Toggle */}
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 group">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-brand-green-500/20 transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="font-display font-bold text-2xl text-dark-900 dark:text-dark-50">
              Brazuca<span className="text-brand-green-500">CMS</span>
            </span>
          </Link>

          {/* Form Card */}
          <div className="bg-white dark:bg-dark-900 rounded-2xl p-8 shadow-xl shadow-dark-900/5 dark:shadow-dark-950/50 border border-gray-100 dark:border-dark-800">
            {children}
          </div>
        </div>
      </div>

      {/* Right Side - Image/Pattern */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-brand-green-500 via-brand-green-600 to-brand-green-700 relative overflow-hidden">
        {/* Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='white'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center p-12 text-white">
          <div className="max-w-md text-center">
            <h2 className="font-display text-3xl font-bold mb-4">
              O CMS brasileiro feito para desenvolvedores
            </h2>
            <p className="text-white/80 mb-8 leading-relaxed">
              Gerencie conteúdo com facilidade, integre com qualquer frontend 
              e escale sem limites.
            </p>

            {/* Testimonial */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <p className="text-white/90 italic mb-4 leading-relaxed">
                "BrazucaCMS transformou a forma como gerenciamos conteúdo. 
                A API é incrível e o suporte é excepcional."
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
                  <span className="font-bold text-lg">LS</span>
                </div>
                <div className="text-left">
                  <p className="font-medium">Leonardo Silva</p>
                  <p className="text-sm text-white/70">Tech Lead @ Startup</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-brand-yellow-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-green-400/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
