import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  Add,
  Folder,
  PlayArrow,
  Stop,
  Edit,
  Delete,
  AccountCircle,
  CloudQueue,
  Security,
  Schedule
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { useProfileStore } from '../stores/profileStore';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profiles, fetchProfiles, deleteProfile } = useProfileStore();
  const [runningProfiles, setRunningProfiles] = useState(new Set());

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleLaunchProfile = async (profileId) => {
    try {
      // استفاده از IPC برای لانچ کردن browser
      const result = await window.electronAPI.launchProfile(profileId);
      if (result.success) {
        setRunningProfiles(prev => new Set(prev).add(profileId));
        toast.success('پروفایل با موفقیت اجرا شد');
      }
    } catch (err) {
      toast.error('خطا در اجرای پروفایل');
    }
  };

  const handleStopProfile = async (profileId) => {
    try {
      const result = await window.electronAPI.closeProfile(profileId);
      if (result.success) {
        setRunningProfiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(profileId);
          return newSet;
        });
        toast.success('پروفایل بسته شد');
      }
    } catch (err) {
      toast.error('خطا در بستن پروفایل');
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (window.confirm('آیا از حذف این پروفایل اطمینان دارید؟')) {
      try {
        await deleteProfile(profileId);
        toast.success('پروفایل حذف شد');
      } catch (err) {
        toast.error('خطا در حذف پروفایل');
      }
    }
  };

  const stats = [
    { label: 'تعداد پروفایل‌ها', value: profiles.length, icon: <Folder />, color: 'primary' },
    { label: 'پروفایل‌های فعال', value: runningProfiles.size, icon: <PlayArrow />, color: 'success' },
    { label: 'سطح اشتراک', value: user?.subscription || 'Free', icon: <Security />, color: 'warning' },
    { label: 'فضای ابری', value: '2.5 GB', icon: <CloudQueue />, color: 'info' }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            داشبورد
          </Typography>
          <Typography variant="body2" color="text.secondary">
            خوش آمدید، {user?.name || user?.email}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/profiles/new')}
          size="large"
        >
          پروفایل جدید
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.label}
                    </Typography>
                    <Typography variant="h5">
                      {stat.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: `${stat.color}.main` }}>
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Profiles */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            پروفایل‌های اخیر
          </Typography>
          <Button
            variant="text"
            onClick={() => navigate('/profiles')}
          >
            مشاهده همه
          </Button>
        </Box>

        {profiles.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <AccountCircle sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              هیچ پروفایلی وجود ندارد
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              برای شروع، اولین پروفایل خود را ایجاد کنید
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/profiles/new')}
            >
              ایجاد پروفایل
            </Button>
          </Box>
        ) : (
          <List>
            {profiles.slice(0, 5).map((profile, index) => (
              <React.Fragment key={profile._id}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    <Box>
                      {runningProfiles.has(profile._id) ? (
                        <IconButton
                          edge="end"
                          onClick={() => handleStopProfile(profile._id)}
                          color="error"
                        >
                          <Stop />
                        </IconButton>
                      ) : (
                        <IconButton
                          edge="end"
                          onClick={() => handleLaunchProfile(profile._id)}
                          color="success"
                        >
                          <PlayArrow />
                        </IconButton>
                      )}
                      <IconButton
                        edge="end"
                        onClick={() => navigate(`/profiles/edit/${profile._id}`)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteProfile(profile._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Folder />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {profile.name}
                        {runningProfiles.has(profile._id) && (
                          <Chip label="در حال اجرا" size="small" color="success" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Schedule sx={{ fontSize: 16 }} />
                        <Typography variant="caption">
                          آخرین استفاده: {profile.lastUsed ? new Date(profile.lastUsed).toLocaleDateString('fa-IR') : 'هرگز'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
}
