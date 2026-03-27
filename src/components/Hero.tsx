import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight, Shield, Eye, Brain, Monitor, Clipboard,
  Maximize, FileText, Mail, MapPin, Phone,
} from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const features = [
  {
    icon: Eye,
    title: "AI Eye Tracking",
    description: "Real-time gaze detection monitors where students look during exams, flagging suspicious eye movements instantly.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Monitor,
    title: "Tab Switch Detection",
    description: "Detects when students navigate away from the exam tab, logging every switch with timestamps.",
    color: "text-accent-teal",
    bg: "bg-accent-teal/10",
  },
  {
    icon: Maximize,
    title: "Fullscreen Enforcement",
    description: "Mandatory fullscreen mode prevents students from accessing other applications during assessments.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Clipboard,
    title: "Copy/Paste Prevention",
    description: "Blocks clipboard operations and right-click context menus to prevent content sharing.",
    color: "text-accent-teal",
    bg: "bg-accent-teal/10",
  },
  {
    icon: Brain,
    title: "Webcam Monitoring",
    description: "Periodic webcam snapshots analyzed by AI to detect unauthorized persons or materials.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: FileText,
    title: "Violation Logging",
    description: "Comprehensive audit trail of all violations exported as JSON for institutional review.",
    color: "text-accent-teal",
    bg: "bg-accent-teal/10",
  },
];

const stats = [
  { value: "99.7%", label: "Detection Accuracy" },
  { value: "10M+", label: "Assessments Secured" },
  { value: "500+", label: "Institutions Trust Us" },
  { value: "<50ms", label: "Detection Latency" },
];

const Hero = () => {
  return (
    <>
      {/* ─── Hero Section ─── */}
      <section id="home" className="pt-20 pb-20 lg:pt-32 lg:pb-32 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
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

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-strong">
                <img
                  src={heroImage}
                  alt="AI-powered anti-cheating monitoring system"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-primary/10"></div>
              </div>
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

      {/* ─── Features Section ─── */}
      <section id="features" className="py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Comprehensive Anti-Cheating Features
            </h2>
            <p className="text-lg text-muted-foreground">
              Six layers of AI-driven protection working together to ensure every
              assessment is fair, transparent, and tamper-proof.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <Card
                key={f.title}
                className="group hover:shadow-medium transition-shadow duration-300 border-border"
              >
                <CardContent className="p-6 space-y-4">
                  <div className={`inline-flex p-3 rounded-xl ${f.bg}`}>
                    <f.icon className={`h-6 w-6 ${f.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── About Section ─── */}
      <section id="about" className="py-20 lg:py-28 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Why ProtorAi?
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Academic dishonesty undermines the value of education for everyone.
                ProtorAi was built by educators and engineers who believe technology
                should protect learning — not hinder it.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our AI continuously monitors webcam feeds, browser behaviour, and
                clipboard activity to flag suspicious actions in real-time — all
                while respecting student privacy through on-device processing and
                transparent audit logs.
              </p>
              <Button variant="hero" size="lg">
                Learn More <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {stats.map((s) => (
                <Card key={s.label} className="text-center border-border">
                  <CardContent className="p-8">
                    <div className="text-3xl font-bold text-primary mb-1">{s.value}</div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contact Section ─── */}
      <section id="contact" className="py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-muted-foreground">
              Have questions or want a demo? Reach out and our team will respond
              within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Contact Form */}
            <Card className="lg:col-span-3 border-border">
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input placeholder="Your Name" className="bg-background" />
                  <Input placeholder="Email Address" type="email" className="bg-background" />
                </div>
                <Input placeholder="Subject" className="bg-background" />
                <Textarea placeholder="Your message..." rows={5} className="bg-background" />
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  Send Message <ArrowRight className="h-5 w-5" />
                </Button>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Email</h3>
                  <p className="text-muted-foreground">support@protorai.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent-teal/10 rounded-xl">
                  <Phone className="h-5 w-5 text-accent-teal" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Phone</h3>
                  <p className="text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Office</h3>
                  <p className="text-muted-foreground">
                    123 Innovation Drive<br />San Francisco, CA 94107
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
