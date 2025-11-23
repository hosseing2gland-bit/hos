import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add,
  Search,
  PlayArrow,
  Stop,
  Edit,
  Delete,
  MoreVert,
  FileCopy,
  CloudUpload,
  CloudDownload,
  Share
} from '@mui/icons-material';
import { useProfileStore } from '../stores/profileStore';
import { toast } from 'react-toastify';

export default function Profiles() {
  const navigate = useNavigate();
  const { profiles, fetchProfiles, deleteProfile, cloneProfile } = useProfileStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [runningProfiles, setRunningProfiles] = useState(new Set());
  const [exportDialog, setExportDialog] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleMenuOpen = (event, profile) => {
    setAnchorEl(event.currentTarget);
    setSelectedProfile(profile);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProfile(null);
  };

  const handleLaunchProfile = async (profileId) => {
    try {
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
        handleMenuClose();
      } catch (err) {
        toast.error('خطا در حذف پروفایل');
      }
    }
  };

  const handleCloneProfile = async () => {
    try {
      await cloneProfile(selectedProfile._id);
      toast.success('پروفایل کپی شد');
      handleMenuClose();
    } catch (err) {
      toast.error('خطا در کپی پروفایل');
    }
  };

  const handleExportProfile = async () => {
    try {
      const result = await window.electronAPI.exportProfile(selectedProfile._id);
      if (result.success) {
        toast.success(`پروفایل در ${result.path} ذخیره شد`);
        setExportDialog(false);
        handleMenuClose();
      }
    } catch (err) {
      toast.error('خطا در Export پروفایل');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          مدیریت پروفایل‌ها
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/profiles/new')}
          size="large"
        >
          پروفایل جدید
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="جستجو در پروفایل‌ها..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
        />
      </Paper>

      {/* Profiles Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>نام پروفایل</TableCell>
              <TableCell>وضعیت</TableCell>
              <TableCell>پروکسی</TableCell>
              <TableCell>تگ‌ها</TableCell>
              <TableCell>آخرین استفاده</TableCell>
              <TableCell align="center">عملیات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm ? 'پروفایلی یافت نشد' : 'هیچ پروفایلی وجود ندارد'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredProfiles.map((profile) => (
                <TableRow key={profile._id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="500">
                      {profile.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {runningProfiles.has(profile._id) ? (
                      <Chip label="در حال اجرا" color="success" size="small" />
                    ) : (
                      <Chip label="خاموش" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {profile.proxy?.enabled ? (
                      <Chip label={profile.proxy.type} color="primary" size="small" />
                    ) : (
                      <Chip label="بدون پروکسی" color="default" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {profile.tags?.slice(0, 2).map((tag, idx) => (
                        <Chip key={idx} label={tag} size="small" variant="outlined" />
                      ))}
                      {profile.tags?.length > 2 && (
                        <Chip label={`+${profile.tags.length - 2}`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {profile.lastUsed
                      ? new Date(profile.lastUsed).toLocaleDateString('fa-IR')
                      : 'هرگز'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {runningProfiles.has(profile._id) ? (
                        <IconButton
                          color="error"
                          onClick={() => handleStopProfile(profile._id)}
                          size="small"
                        >
                          <Stop />
                        </IconButton>
                      ) : (
                        <IconButton
                          color="success"
                          onClick={() => handleLaunchProfile(profile._id)}
                          size="small"
                        >
                          <PlayArrow />
                        </IconButton>
                      )}
                      <IconButton
                        onClick={() => navigate(`/profiles/edit/${profile._id}`)}
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, profile)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleCloneProfile}>
          <FileCopy sx={{ mr: 1 }} fontSize="small" />
          کپی پروفایل
        </MenuItem>
        <MenuItem onClick={() => setExportDialog(true)}>
          <CloudDownload sx={{ mr: 1 }} fontSize="small" />
          Export
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Share sx={{ mr: 1 }} fontSize="small" />
          اشتراک‌گذاری
        </MenuItem>
        <MenuItem onClick={() => handleDeleteProfile(selectedProfile?._id)} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          حذف
        </MenuItem>
      </Menu>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export پروفایل</DialogTitle>
        <DialogContent>
          <Typography>
            آیا می‌خواهید پروفایل "{selectedProfile?.name}" را Export کنید؟
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>انصراف</Button>
          <Button onClick={handleExportProfile} variant="contained">
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
