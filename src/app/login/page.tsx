'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useI18n } from '@/shared/i18n/i18n-context';
import { useAuthStore } from '@/shared/state/auth-store';
import { ThemeToggle } from '@/shared/components/theme/theme-toggle';
import { LanguageToggle } from '@/shared/components/theme/language-toggle';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { getFullVersionString } from '@/core/utils/version';
import { Loader2 } from 'lucide-react';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullNameEn: string;
    fullNameAr?: string;
    avatarUrl?: string;
    roles: string[];
  };
  token: string;
  refreshToken: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { t } = useI18n();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiClient.post<LoginResponse>('/api/auth/login', { 
        email, 
        password,
        rememberMe
      });

      if (response.success && response.data) {
        login(response.data.user, response.data.token, rememberMe);
        toast.success(t('auth.loginSuccess'));
        router.push('/dashboard');
      } else {
        toast.error(response.message || t('auth.loginError'));
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(getErrorMessage(error, t('messages.error')));
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
              className="flex items-center justify-center mb-6"
              initial={{ scale: 0, opacity: 0, y: -30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.2
              }}
            >
              <motion.div
                className="relative"
                whileHover={{ 
                  scale: 1.05,
                  y: -5
                }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  y: [0, -3, 0]
                }}
                transition={{
                  y: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                {/* Subtle glow effect behind logo */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl rounded-2xl"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                <motion.img
                  src="/ameen.avif"
                  alt="Ameen Logo"
                  className="relative w-24 h-24 object-contain drop-shadow-2xl"
                  initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    rotateY: 0
                  }}
                  transition={{ 
                    delay: 0.5, 
                    duration: 1.5,
                    type: "spring",
                    stiffness: 120,
                    damping: 15
                  }}
                  whileHover={{ 
                    scale: 1.1,
                    filter: "brightness(1.1) contrast(1.1) drop-shadow(0 10px 20px rgba(59, 130, 246, 0.3))",
                    rotateY: 5
                  }}
                  style={{
                    filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))"
                  }}
                />
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-2xl text-center font-bold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                {mounted ? t('auth.loginTitle') : ''}
              </CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <CardDescription className="text-center">
                {mounted ? t('auth.loginSubtitle') : ''}
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
              <Label htmlFor="email">{mounted && t('auth.email')}</Label>
                            <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mounted ? t('auth.emailPlaceholder') : ''}
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
              <Label htmlFor="password">{mounted && t('auth.password')}</Label>
                            <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mounted ? t('auth.passwordPlaceholder') : ''}
                dir="ltr"
                className="text-left"
              />
            </motion.div>
            <motion.div 
              className="flex items-center space-x-2 rtl:space-x-reverse pt-2 pb-4"
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
                {mounted && t('auth.rememberMe')}
              </label>
            </motion.div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6">
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
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    mounted ? t('auth.login') : 'Login'
                  )}
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Demo credentials */}
            <motion.div
              className="text-sm text-center text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {mounted && t('auth.forgotPassword')}
              </a>
            </motion.div>
          </CardFooter>
        </form>
        </Card>
      </motion.div>
      
      {/* Version Information - Outside login card */}
      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
      >
        <div className="text-xs text-muted-foreground/60 text-center backdrop-blur-sm bg-background/30 px-3 py-1 rounded-full border border-border/20">
          <span className="font-mono tracking-wider">
            {getFullVersionString()}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
