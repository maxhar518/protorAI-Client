import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { Shield, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileFormData {
  name: string;
  email: string;
  Institute: string;
  phone: string;
  avatar: string;
}

const Profile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const { toast } = useToast();

  const [user, setUser] = useState({
    name: "",
    email: "",
    Institute: "",
    phone: "",
    avatar: "",
  });


  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      name: user.name,
      email: user.email,
      Institute: user.Institute,
      phone: user.phone,
      avatar: user.avatar,
    },
  });

  useEffect(() => {
    const controller = new AbortController();
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: "Login Required", description: "Please log in first.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/user/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log(data?.response);

        if (data?.success) {
          const userInfo = data?.response;
          const updatedUser = {
            name: userInfo.name || "",
            email: userInfo.email || "",
            Institute: userInfo?.Institute || "",
            phone: userInfo.phone || "",
            avatar: userInfo.profilePicture || "",
          };

          setUser(updatedUser);
          profileForm.reset(updatedUser);
          toast({
            title: "Success",
            description: "Profile data fetched successfully.",
          });
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to fetch profile.",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast({
            title: "Error",
            description: "Failed to load profile data. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchUserData();

    return () => controller.abort();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: "Login Required", description: "Please log in first.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", selectedFile);

    const response = await fetch("http://localhost:3000/user/profilePicture", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData,
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    if (data?.success) {
      toast({
        title: "Success",
        description: "Profile Picture fetched successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: data.message || "Failed to fetch profile Picture.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
              <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and Institute details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Form */}
            <Form {...profileForm}>
              <form className="space-y-4">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={`http://localhost:3000${user?.avatar}`} />
                  </Avatar>
                  {/* File Upload Input */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleUploadClick}
                      className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                    >
                      Upload Image
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your full name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="Enter your email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="Institute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institute</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your Institute" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your phone number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;