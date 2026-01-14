import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, User, Sparkles, Heart, Star } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryNav />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-sky to-teal mb-6 float">
              <User className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text-cool mb-4">
              About Me
            </h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Sparkles className="w-5 h-5 text-yellow" />
              <span className="text-lg">Welcome to My First Website!</span>
              <Sparkles className="w-5 h-5 text-yellow" />
            </div>
          </div>

          {/* Main Content Card */}
          <Card className="card-animated border-2 border-sky/20 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-sky via-teal to-green" />
            <CardContent className="p-8 md:p-12">
              <div className="space-y-8">
                {/* Introduction */}
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Hi, I am{" "}
                    <span className="gradient-text-cool">Ayush Gupta</span>
                  </h2>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    I study in{" "}
                    <span className="font-semibold text-sky">Class 7</span>
                  </p>
                </div>

                {/* Decorative Divider */}
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sky/50 to-transparent" />
                  <Star className="w-6 h-6 text-yellow fill-yellow" />
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sky/50 to-transparent" />
                </div>

                {/* Message */}
                <div className="bg-gradient-to-br from-sky/10 to-teal/10 rounded-2xl p-6 md:p-8 text-center">
                  <p className="text-lg md:text-xl text-foreground leading-relaxed">
                    This is my <span className="font-bold text-teal">first website</span>!
                  </p>
                  <p className="text-lg md:text-xl text-foreground leading-relaxed mt-2">
                    Hope you{" "}
                    <span className="inline-flex items-center gap-1">
                      <Heart className="w-5 h-5 text-red fill-red animate-pulse" />
                      <span className="font-semibold text-red">like</span>
                    </span>{" "}
                    this website.
                  </p>
                </div>

                {/* Contact Section */}
                <div className="bg-muted/50 rounded-2xl p-6 md:p-8">
                  <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                    For More Information
                  </h3>
                  <div className="flex items-center justify-center gap-3 text-lg">
                    <Mail className="w-6 h-6 text-sky" />
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-semibold text-foreground bg-gradient-to-r from-sky/20 to-teal/20 px-4 py-2 rounded-full">
                      kumariguptamoti
                    </span>
                  </div>
                </div>

                {/* Thank You */}
                <div className="text-center pt-4">
                  <p className="text-2xl font-bold gradient-text-cool">
                    Thank You for Visiting! 🙏
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 CostSeer AI. Created with ❤️ by Ayush Gupta
          </p>
        </div>
      </footer>
    </div>
  );
};

export default About;
