import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useUniversities } from "@/hooks/use-universities";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [generatedUsername, setGeneratedUsername] = useState<string | null>(null);
  const { login, register, user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: universities, isLoading: unisLoading } = useUniversities();

  if (user && !generatedUsername) {
    setLocation(`/u/${user.universityId}`);
    return null;
  }

  if (generatedUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl">Welcome to nerdds!</CardTitle>
            <CardDescription>Your account has been created successfully.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-neutral-100 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Your auto-generated username is:</p>
              <p className="text-2xl font-mono font-bold tracking-tight">{generatedUsername}</p>
              <p className="text-xs text-muted-foreground mt-2">Use this username to sign in next time.</p>
            </div>
            <Button className="w-full h-11" onClick={() => {
              setGeneratedUsername(null);
              setLocation(`/u/${user?.universityId}`);
            }}>
              Go to Campus Feed
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-neutral-50">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex flex-col justify-between bg-black p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80')] opacity-20 bg-cover bg-center" />
        {/* Abstract university vibes image */}
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <GraduationCap className="w-8 h-8" />
            <h1 className="font-display font-bold text-2xl tracking-tighter">nerdds.</h1>
          </div>
          
          <h2 className="font-display font-bold text-5xl leading-tight mb-6">
            The exclusive social network for your campus.
          </h2>
          <p className="text-neutral-400 text-lg max-w-md">
            Connect with peers, join study groups, and level up from Fresher to Legend. Locked to your university.
          </p>
        </div>

        <div className="relative z-10 flex gap-4 text-sm text-neutral-500">
          <span>© 2024 nerdds</span>
          <span>Privacy</span>
          <span>Terms</span>
        </div>
      </div>

      {/* Right Panel - Forms */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="font-display font-bold text-3xl">Get Started</h2>
            <p className="text-muted-foreground mt-2">Join the conversation at your university today.</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm />
            </TabsContent>

            <TabsContent value="register">
              <RegisterForm 
                universities={universities || []} 
                loading={unisLoading} 
                onUserCreated={(username) => setGeneratedUsername(username)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const form = useForm({
    defaultValues: { username: "", password: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => login.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="nerd_123" {...field} className="h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full h-11 mt-2" disabled={login.isPending}>
          {login.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm({ universities, loading, onUserCreated }: { universities: any[], loading: boolean, onUserCreated: (username: string) => void }) {
  const { register } = useAuth();
  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: "",
      universityId: undefined,
      department: "",
      semester: "1",
      bio: "",
    },
  });

  const onSubmit = (data: any) => {
    register.mutate(data, {
      onSuccess: (user) => {
        onUserCreated(user.username);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="universityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select University</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Where do you study?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loading ? (
                    <div className="p-2 text-center text-sm">Loading...</div>
                  ) : (
                    universities.map((uni) => (
                      <SelectItem key={uni.id} value={uni.id.toString()}>
                        {uni.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Email</FormLabel>
              <FormControl>
                <Input placeholder="you@uni.edu" {...field} className="h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="CS, Arts..." {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="semester"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Semester</FormLabel>
                <FormControl>
                  <Input placeholder="1st, 2nd..." {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Create a strong password" {...field} className="h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full h-11 mt-4 font-bold" disabled={register.isPending}>
          {register.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          By signing up, you agree to our Code of Conduct.
        </p>
      </form>
    </Form>
  );
}
