'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import Loader from '@/components/Loader';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [avatarUpdated, setAvatarUpdated] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    getProfile();
  }, []);

  useEffect(() => {
    if (profileSaved) {
      const t = setTimeout(() => setProfileSaved(false), 3000);
      return () => clearTimeout(t);
    }
  }, [profileSaved]);

  useEffect(() => {
    if (passwordUpdated) {
      const t = setTimeout(() => setPasswordUpdated(false), 3000);
      return () => clearTimeout(t);
    }
  }, [passwordUpdated]);

  useEffect(() => {
    if (avatarUpdated) {
      const t = setTimeout(() => setAvatarUpdated(false), 3000);
      return () => clearTimeout(t);
    }
  }, [avatarUpdated]);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setUsername(user.user_metadata?.username || '');
      }
    } catch (error) {
      console.log('Error loading user data!');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        data: { username },
      });

      if (error) throw error;
      toast({ title: 'Profile updated successfully!' });
      setProfileSaved(true);
    } catch (error) {
      toast({ title: 'Error updating profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
       toast({ title: "Password must be at least 6 characters", variant: 'destructive' });
       return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: 'Password updated successfully!' });
      setPassword('');
      setConfirmPassword('');
      setPasswordUpdated(true);
    } catch (error) {
      toast({ title: 'Error updating password', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) throw updateError;
      
      // Refresh user
      const { data: { user: newUser } } = await supabase.auth.getUser();
      setUser(newUser);
      
      toast({ title: 'Avatar uploaded successfully!' });
      setAvatarUpdated(true);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error uploading avatar', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };
  
  const deleteAvatar = async () => {
      try {
          setLoading(true);
          // Optional: Delete from storage if we track the path.
          // For now just clear metadata.
           const { error } = await supabase.auth.updateUser({
            data: { avatar_url: null },
          });
          if (error) throw error;
          
           // Refresh user
          const { data: { user: newUser } } = await supabase.auth.getUser();
          setUser(newUser);
          
          toast({ title: 'Avatar removed' });
          setAvatarUpdated(true);
      } catch(error) {
          toast({ title: 'Error removing avatar', variant: 'destructive' });
      } finally {
          setLoading(false);
      }
  }

  if (loading && !user) return <Loader />;

  return (
    <section className="flex size-full flex-col gap-10 text-black dark:text-white p-6">
      <h1 className="text-3xl font-bold">Profile Settings</h1>
      
      <div className="flex flex-col gap-6 w-full max-w-2xl">
        {/* Avatar Section */}
        <div className="bg-white dark:bg-dark-1 p-6 rounded-lg space-y-4 shadow-md dark:shadow-none border dark:border-none">
            <h2 className="text-xl font-semibold">Profile Picture</h2>
            <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gray-200 dark:bg-dark-3">
                     <Image
                        src={user?.user_metadata?.avatar_url || '/icons/user.svg'}
                        alt="Avatar"
                        fill
                        className="object-cover"
                     />
                </div>
                <div className="flex flex-col gap-2">
                    <div className="relative">
                        <Input
                            type="file"
                            id="avatar"
                            accept="image/*"
                            onChange={uploadAvatar}
                            disabled={uploading}
                            className="hidden"
                        />
                        <Button asChild variant="secondary" disabled={uploading} className="bg-gray-200 dark:bg-dark-3 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-dark-4">
                            <label htmlFor="avatar" className="cursor-pointer">
                                {uploading ? 'Uploading...' : 'Upload New Picture'}
                            </label>
                        </Button>
                    </div>
                    {user?.user_metadata?.avatar_url && (
                        <Button variant="destructive" onClick={deleteAvatar} disabled={loading}>
                            Remove Picture
                        </Button>
                    )}
                    {avatarUpdated && (
                        <p className="text-sm text-green-600 dark:text-green-400">Profile picture updated</p>
                    )}
                </div>
            </div>
        </div>

        {/* Edit Profile Section */}
        <div className="bg-white dark:bg-dark-1 p-6 rounded-lg space-y-4 shadow-md dark:shadow-none border dark:border-none">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-gray-50 dark:bg-dark-3 border-gray-200 dark:border-none text-black dark:text-white"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-100 dark:bg-dark-3 border-none text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
            </div>
            <Button onClick={updateProfile} disabled={loading} className="bg-blue-1 text-white hover:bg-blue-700">
                Save Changes
            </Button>
            {profileSaved && (
                <p className="text-sm text-green-600 dark:text-green-400">Changes saved</p>
            )}
        </div>

        {/* Change Password Section */}
        <div className="bg-white dark:bg-dark-1 p-6 rounded-lg space-y-4 shadow-md dark:shadow-none border dark:border-none">
            <h2 className="text-xl font-semibold">Change Password</h2>
            <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-50 dark:bg-dark-3 border-gray-200 dark:border-none text-black dark:text-white"
                    placeholder="Enter new password"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-gray-50 dark:bg-dark-3 border-gray-200 dark:border-none text-black dark:text-white"
                     placeholder="Confirm new password"
                />
            </div>
             <Button onClick={updatePassword} disabled={loading || !password} className="bg-blue-1 text-white hover:bg-blue-700">
                Update Password
            </Button>
             {passwordUpdated && (
                <p className="text-sm text-green-600 dark:text-green-400">Password updated</p>
             )}
        </div>
      </div>
    </section>
  );
}
