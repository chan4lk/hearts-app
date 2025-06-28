import React from 'react';
import Link from 'next/link';
import { Goal } from 'lucide-react';

export default function Footer() {
  return (
<footer className="bg-gradient-to-b from-[#0B1120] via-[#132145] to-[#1E1B4B]">

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
 {/* Logo */}
 <a href="/" className="group relative transform hover:scale-105 transition-all duration-300">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="Bistec Logo"
                  className="h-12 w-auto object-contain glow-effect transition-all duration-300"
                />
              </div>
            </a>              <span className="text-2xl font-bold text-foreground">AspireHub</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Elevating team performance through seamless goal management.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-sm text-muted-foreground hover:text-primary">Features</Link></li>
              <li><Link href="#workflow" className="text-sm text-muted-foreground hover:text-primary">Workflow</Link></li>
              <li><Link href="#azure" className="text-sm text-muted-foreground hover:text-primary">Integrations</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">About Us</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Careers</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AspireHub by Bistecglobal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

