import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  Alert
} from '@mui/material';
import {
  AccountCircle,
  Security,
  Storage,
  Notifications,
  Info
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    // Account
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    // Security
    twoFactorEnabled: false,
    sessionTimeout: 30,
    // Storage
    autoSync: true,
    syncInterval: 15,
    localStoragePath: '',
    // Notifications
    emailNotifications: true,
    desktopNotifications: true,
    soundEnabled: true
  });

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveAccount = async () => {
    try {
      // TODO: API call to update account
      toast.success('تنظیمات حساب کاربری ذخیره شد');
    } catch (err) {
      toast.error('خطا در ذخیره تنظیمات');
    }
  };

  const handleChangePassword = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      toast.error('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }

    if (settings.newPassword.length < 8) {
      toast.error('رمز عبور باید حداقل 8 کاراکتر باشد');
      return;
    }

    try {
      // TODO: API call to change password
      toast.success('رمز عبور تغییر یافت');
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      toast.error('خطا در تغییر رمز عبور');
    }
  };

  const handleSaveSettings = async () => {
    try {
      // TODO: Save to electron-store
      await window.electronAPI.saveSettings(settings);
      toast.success('تنظیمات ذخیره شد');
    } catch (err) {
      toast.error('خطا در ذخیره تنظیمات');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          تنظیمات
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab icon={<AccountCircle />} label="حساب کاربری" />
            <Tab icon={<Security />} label="امنیت" />
            <Tab icon={<Storage />} label="ذخیره‌سازی" />
            <Tab icon={<Notifications />} label="اعلان‌ها" />
            <Tab icon={<Info />} label="درباره" />
          </Tabs>
        </Box>

        {/* Account Tab */}
        <TabPanel value={activeTab} index={0}>
          <TextField
            fullWidth
            label="نام"
            value={settings.name}
            onChange={(e) => handleChange('name', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="ایمیل"
            type="email"
            value={settings.email}
            onChange={(e) => handleChange('email', e.target.value)}
            margin="normal"
            disabled
          />
          <Button
            variant="contained"
            onClick={handleSaveAccount}
            sx={{ mt: 2 }}
          >
            ذخیره تغییرات
          </Button>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            تغییر رمز عبور
          </Typography>
          <TextField
            fullWidth
            label="رمز عبور فعلی"
            type="password"
            value={settings.currentPassword}
            onChange={(e) => handleChange('currentPassword', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="رمز عبور جدید"
            type="password"
            value={settings.newPassword}
            onChange={(e) => handleChange('newPassword', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="تکرار رمز عبور جدید"
            type="password"
            value={settings.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            margin="normal"
          />
          <Button
            variant="contained"
            onClick={handleChangePassword}
            sx={{ mt: 2 }}
          >
            تغییر رمز عبور
          </Button>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={1}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.twoFactorEnabled}
                onChange={(e) => handleChange('twoFactorEnabled', e.target.checked)}
              />
            }
            label="احراز هویت دو مرحله‌ای (2FA)"
          />

          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel>Session Timeout</InputLabel>
            <Select
              value={settings.sessionTimeout}
              onChange={(e) => handleChange('sessionTimeout', e.target.value)}
            >
              <MenuItem value={15}>15 دقیقه</MenuItem>
              <MenuItem value={30}>30 دقیقه</MenuItem>
              <MenuItem value={60}>1 ساعت</MenuItem>
              <MenuItem value={120}>2 ساعت</MenuItem>
              <MenuItem value={0}>هیچ‌وقت</MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 3 }}>
            با فعال کردن 2FA، امنیت حساب شما افزایش می‌یابد.
          </Alert>

          <Button
            variant="contained"
            onClick={handleSaveSettings}
            sx={{ mt: 3 }}
          >
            ذخیره تنظیمات
          </Button>
        </TabPanel>

        {/* Storage Tab */}
        <TabPanel value={activeTab} index={2}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.autoSync}
                onChange={(e) => handleChange('autoSync', e.target.checked)}
              />
            }
            label="همگام‌سازی خودکار با Cloud"
          />

          {settings.autoSync && (
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>فاصله زمانی همگام‌سازی</InputLabel>
              <Select
                value={settings.syncInterval}
                onChange={(e) => handleChange('syncInterval', e.target.value)}
              >
                <MenuItem value={5}>هر 5 دقیقه</MenuItem>
                <MenuItem value={15}>هر 15 دقیقه</MenuItem>
                <MenuItem value={30}>هر 30 دقیقه</MenuItem>
                <MenuItem value={60}>هر 1 ساعت</MenuItem>
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            label="مسیر ذخیره‌سازی محلی"
            value={settings.localStoragePath}
            margin="normal"
            sx={{ mt: 3 }}
            helperText="مسیر ذخیره پروفایل‌ها در سیستم شما"
            InputProps={{
              readOnly: true
            }}
          />

          <Button
            variant="contained"
            onClick={handleSaveSettings}
            sx={{ mt: 3 }}
          >
            ذخیره تنظیمات
          </Button>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={3}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.emailNotifications}
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
              />
            }
            label="اعلان‌های ایمیل"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.desktopNotifications}
                onChange={(e) => handleChange('desktopNotifications', e.target.checked)}
              />
            }
            label="اعلان‌های دسکتاپ"
            sx={{ display: 'block', mt: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.soundEnabled}
                onChange={(e) => handleChange('soundEnabled', e.target.checked)}
              />
            }
            label="صدای اعلان"
            sx={{ display: 'block', mt: 2 }}
          />

          <Button
            variant="contained"
            onClick={handleSaveSettings}
            sx={{ mt: 3 }}
          >
            ذخیره تنظیمات
          </Button>
        </TabPanel>

        {/* About Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              Anti-Detect Browser
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              نسخه 1.0.0
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Typography variant="body1" paragraph>
              مرورگر Anti-Detect حرفه‌ای با قابلیت مدیریت چندین پروفایل
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              © 2024 Anti-Detect Browser. All rights reserved.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Button variant="outlined" sx={{ mx: 1 }}>
                بررسی به‌روزرسانی
              </Button>
              <Button variant="outlined" sx={{ mx: 1 }}>
                گزارش مشکل
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
}
