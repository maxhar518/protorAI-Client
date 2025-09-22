import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Eye, Brain } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section id="home" className="pt-20 pb-20 lg:pt-32 lg:pb-32 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
                <Shield className="h-4 w-4" />
                AI-Powered Academic Integrity
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Stop Cheating Before It{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Happens
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                ProtorAi uses advanced AI monitoring to detect and prevent academic 
                dishonesty in real-time. Protect the integrity of your assessments 
                with our comprehensive anti-cheating solution.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="text-lg">
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg">
                Watch Demo
              </Button>
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Eye Tracking</h3>
                  <p className="text-sm text-muted-foreground">Real-time monitoring</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-teal/10 rounded-lg">
                  <Brain className="h-5 w-5 text-accent-teal" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">AI Analysis</h3>
                  <p className="text-sm text-muted-foreground">Smart detection</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Secure Platform</h3>
                  <p className="text-sm text-muted-foreground">Enterprise-grade</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
              <img
                src={heroImage}
                alt="AI-powered anti-cheating monitoring system"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-primary/10"></div>
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -bottom-6 -left-6 bg-card rounded-xl p-6 shadow-medium border border-border">
              <div className="text-2xl font-bold text-foreground">99.7%</div>
              <div className="text-sm text-muted-foreground">Detection Rate</div>
            </div>
            
            <div className="absolute -top-6 -right-6 bg-card rounded-xl p-6 shadow-medium border border-border">
              <div className="text-2xl font-bold text-foreground">10M+</div>
              <div className="text-sm text-muted-foreground">Assessments Secured</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;