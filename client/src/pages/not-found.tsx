import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-neutral-50">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="flex justify-center mb-4">
           <AlertCircle className="h-24 w-24 text-neutral-200" />
        </div>
        <h1 className="font-display font-bold text-4xl text-neutral-900">404</h1>
        <p className="text-lg text-neutral-600">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button size="lg" className="mt-4">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
