'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useI18n } from '@/lib/i18n/i18n-context';
import { useAuthStore } from '@/store/auth-store';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { t } = useI18n();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        login(data.data.user, data.data.token);
        toast.success(t('auth.loginSuccess'));
        router.push('/dashboard');
      } else {
        toast.error(t('auth.loginError'));
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(t('messages.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-blue-50 dark:from-blue-950 dark:via-background dark:to-blue-950 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-20 left-20 w-72 h-72 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300/10 dark:bg-blue-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-2xl backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1">
            <motion.div 
              className="absolute top-4 right-4 rtl:right-auto rtl:left-4 flex gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <LanguageToggle />
              <ThemeToggle />
            </motion.div>
            <motion.div 
              className="flex items-center justify-center mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2
              }}
            >
              <motion.div 
                className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                AH
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-2xl text-center font-bold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                {t('auth.loginTitle')}
              </CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <CardDescription className="text-center">
                {t('auth.loginSubtitle')}
              </CardDescription>
            </motion.div>
          </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label htmlFor="email">{t('auth.email')}</Label>
                            <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                dir="ltr"
                className="text-left"
              />
            </motion.div>
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Label htmlFor="password">{t('auth.password')}</Label>
                            <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                dir="ltr"
                className="text-left"
              />
            </motion.div>
            <motion.div 
              className="flex items-center space-x-2 rtl:space-x-reverse pt-2 pb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t('auth.rememberMe')}
              </label>
            </motion.div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 transition-all" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      ⟳
                    </motion.div>
                  ) : (
                    t('auth.login')
                  )}
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Demo credentials */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="p-3 bg-muted rounded-lg border"
            >
              <p className="text-xs text-center text-muted-foreground font-medium mb-1">
                🔐 Demo Credentials
              </p>
              <div className="text-xs text-center space-y-0.5">
                <p className="text-muted-foreground">
                  <span className="font-mono">admin@ameen.com</span>
                </p>
                <p className="text-muted-foreground">
                  <span className="font-mono">Admin@123456</span>
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="text-sm text-center text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {t('auth.forgotPassword')}
              </a>
            </motion.div>
          </CardFooter>
        </form>
      </Card>
      </motion.div>
    </div>
  );
}
