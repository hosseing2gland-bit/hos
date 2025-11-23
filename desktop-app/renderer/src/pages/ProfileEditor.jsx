import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Save,
  Cancel,
  ExpandMore,
  Security,
  Language,
  NetworkCheck,
  Cookie
} from '@mui/icons-material';
import { useProfileStore } from '../stores/profileStore';
import { toast } from 'react-toastify';

export default function ProfileEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { createProfile, updateProfile, getProfileById } = useProfileStore();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    tags: [],
    notes: '',
    fingerprint: {
      canvas: true,
      webgl: true,
      audio: true,
      webrtc: { mode: 'real', publicIp: '', privateIp: '' },
      timezone: 'auto',
      geolocation: { enabled: false, latitude: '', longitude: '', accuracy: 100 },
      userAgent: 'auto'
    },
    proxy: {
      enabled: false,
      type: 'http',
      host: '',
      port: '',
      username: '',
      password: ''
    },
    cookies: [],
    localStorage: {},
    extensions: []
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isEditMode) {
      loadProfile();
    }
  }, [id]);

  const loadProfile = async () => {
    try {
      const profile = await getProfileById(id);
      setFormData(profile);
    } catch (err) {
      toast.error('خطا در بارگذاری پروفایل');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToDelete)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('لطفا نام پروفایل را وارد کنید');
      return;
    }

    try {
      if (isEditMode) {
        await updateProfile(id, formData);
        toast.success('پروفایل به‌روزرسانی شد');
      } else {
        await createProfile(formData);
        toast.success('پروفایل ایجاد شد');
      }
      navigate('/profiles');
    } catch (err) {
      toast.error('خطا در ذخیره پروفایل');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {isEditMode ? 'ویرایش پروفایل' : 'ایجاد پروفایل جدید'}
        </Typography>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="نام پروفایل"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              margin="normal"
            />

            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="افزودن تگ"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                margin="normal"
                helperText="Enter را برای افزودن تگ بزنید"
              />
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag, idx) => (
                  <Chip
                    key={idx}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                  />
                ))}
              </Box>
            </Box>

            <TextField
              fullWidth
              label="یادداشت"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              multiline
              rows={3}
              margin="normal"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Fingerprint Settings */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Security sx={{ mr: 1 }} />
                <Typography>تنظیمات Fingerprint</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.fingerprint.canvas}
                        onChange={(e) => handleNestedChange('fingerprint', 'canvas', e.target.checked)}
                      />
                    }
                    label="Canvas Spoofing"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.fingerprint.webgl}
                        onChange={(e) => handleNestedChange('fingerprint', 'webgl', e.target.checked)}
                      />
                    }
                    label="WebGL Spoofing"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.fingerprint.audio}
                        onChange={(e) => handleNestedChange('fingerprint', 'audio', e.target.checked)}
                      />
                    }
                    label="Audio Spoofing"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>WebRTC Mode</InputLabel>
                    <Select
                      value={formData.fingerprint.webrtc.mode}
                      onChange={(e) => handleNestedChange('fingerprint', 'webrtc', { ...formData.fingerprint.webrtc, mode: e.target.value })}
                    >
                      <MenuItem value="real">Real</MenuItem>
                      <MenuItem value="fake">Fake</MenuItem>
                      <MenuItem value="disabled">Disabled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="User Agent (خالی = Auto)"
                    value={formData.fingerprint.userAgent}
                    onChange={(e) => handleNestedChange('fingerprint', 'userAgent', e.target.value)}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Proxy Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <NetworkCheck sx={{ mr: 1 }} />
                <Typography>تنظیمات پروکسی</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.proxy.enabled}
                    onChange={(e) => handleNestedChange('proxy', 'enabled', e.target.checked)}
                  />
                }
                label="فعال‌سازی پروکسی"
              />

              {formData.proxy.enabled && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>نوع پروکسی</InputLabel>
                      <Select
                        value={formData.proxy.type}
                        onChange={(e) => handleNestedChange('proxy', 'type', e.target.value)}
                      >
                        <MenuItem value="http">HTTP</MenuItem>
                        <MenuItem value="https">HTTPS</MenuItem>
                        <MenuItem value="socks4">SOCKS4</MenuItem>
                        <MenuItem value="socks5">SOCKS5</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Host"
                      value={formData.proxy.host}
                      onChange={(e) => handleNestedChange('proxy', 'host', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Port"
                      type="number"
                      value={formData.proxy.port}
                      onChange={(e) => handleNestedChange('proxy', 'port', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Username (اختیاری)"
                      value={formData.proxy.username}
                      onChange={(e) => handleNestedChange('proxy', 'username', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Password (اختیاری)"
                      type="password"
                      value={formData.proxy.password}
                      onChange={(e) => handleNestedChange('proxy', 'password', e.target.value)}
                    />
                  </Grid>
                </Grid>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Action Buttons */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => navigate('/profiles')}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
            >
              {isEditMode ? 'به‌روزرسانی' : 'ایجاد'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}
