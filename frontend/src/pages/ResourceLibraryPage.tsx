import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    FolderOpen, Upload, Download, Trash2,
    Grid, List, Search, Users, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Loading, ErrorMessage } from '../components/common/LoadingError';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
    fetchFiles,
    fetchMyFiles,
    fetchSharedWithMe,
    uploadFile,
    deleteFile,
    getFileIcon,
    getFileColor,
    type StudyFileList
} from '../api/resourcesApi';

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'my_files' | 'shared';

export default function ResourceLibraryPage() {
    const [files, setFiles] = useState<StudyFileList[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const { isPremium } = useAuth();

    useEffect(() => {
        loadFiles();
    }, [filterMode]);

    const loadFiles = async () => {
        try {
            setLoading(true);
            let data: StudyFileList[];

            switch (filterMode) {
                case 'my_files':
                    data = await fetchMyFiles();
                    break;
                case 'shared':
                    data = await fetchSharedWithMe();
                    break;
                default:
                    data = await fetchFiles();
            }

            setFiles(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load files');
        } finally {
            setLoading(false);
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!isPremium) {
            toast.error("Premium subscription required to upload files");
            return;
        }
        if (acceptedFiles.length === 0) return;

        setUploading(true);
        try {
            for (const file of acceptedFiles) {
                await uploadFile(file);
                toast.success(`${file.name} uploaded successfully!`);
            }
            loadFiles();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-powerpoint': ['.ppt'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'text/plain': ['.txt'],
        }
    });

    const handleDownload = (file: StudyFileList) => {
        window.open(file.file_url, '_blank');
    };

    const handleDelete = async (file: StudyFileList) => {
        if (!confirm(`Are you sure you want to delete "${file.filename}"?`)) return;

        try {
            await deleteFile(file.id);
            toast.success('File deleted successfully!');
            loadFiles();
        } catch (err: any) {
            toast.error('Failed to delete file');
        }
    };

    const filteredFiles = files.filter(file =>
        file.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getFilePreview = (file: StudyFileList) => {
        if (file.file_type === 'image') {
            return (
                <img
                    src={file.file_url}
                    alt={file.filename}
                    className="w-full h-32 object-cover rounded-lg"
                />
            );
        }

        return (
            <div className="w-full h-32 bg-slate-700/50 rounded-lg flex items-center justify-center">
                <span className="text-5xl">{getFileIcon(file.file_type)}</span>
            </div>
        );
    };

    if (loading && files.length === 0) return <Loading />;
    if (error) return <ErrorMessage error={error} />;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                            <FolderOpen className="text-purple-400" size={32} />
                            Resource Library
                        </h1>
                        <p className="text-slate-400">Upload and share study materials with your buddies.</p>
                    </div>
                </div>

                {/* Upload Zone */}
                <div
                    {...(!isPremium ? {} : getRootProps())}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isPremium ? 'cursor-pointer' : 'cursor-default'} ${isDragActive
                        ? 'border-purple-500 bg-purple-500/10'
                        : !isPremium
                            ? 'border-slate-800 bg-[#1e293b]/50 opacity-75'
                            : 'border-slate-700 hover:border-slate-600 bg-[#1e293b]'
                        }`}
                >
                    {!isPremium ? (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                                <Lock size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Premium Feature</h3>
                            <p className="text-slate-400 max-w-md mx-auto mb-6">
                                Uploading and sharing study materials is only available for Premium members.
                            </p>
                            <Link
                                to="/subscription"
                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                            >
                                Upgrade to Premium
                            </Link>
                        </div>
                    ) : (
                        <>
                            <input {...getInputProps()} />
                            <Upload className={`mx-auto mb-4 ${isDragActive ? 'text-purple-400' : 'text-slate-500'}`} size={48} />
                            {uploading ? (
                                <p className="text-purple-400 font-medium">Uploading...</p>
                            ) : isDragActive ? (
                                <p className="text-purple-400 font-medium">Drop files here...</p>
                            ) : (
                                <>
                                    <p className="text-white font-medium mb-2">
                                        Drag & drop files here, or click to browse
                                    </p>
                                    <p className="text-slate-500 text-sm">
                                        Supports PDF, Images, Word, PowerPoint, and more
                                    </p>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Filter & View */}
                    <div className="flex gap-3">
                        {/* Filter Tabs */}
                        <div className="flex bg-[#1e293b] rounded-xl p-1 border border-slate-700">
                            {[
                                { value: 'all', label: 'All' },
                                { value: 'my_files', label: 'My Files' },
                                { value: 'shared', label: 'Shared' }
                            ].map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setFilterMode(value as FilterMode)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterMode === value
                                        ? 'bg-purple-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-[#1e293b] rounded-xl p-1 border border-slate-700">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400'
                                    }`}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400'
                                    }`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Files */}
                {filteredFiles.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600 transition-all group"
                                >
                                    {/* Preview */}
                                    <div className="p-4">
                                        {getFilePreview(file)}
                                    </div>

                                    {/* Info */}
                                    <div className="px-4 pb-4">
                                        <h3 className="text-white font-medium truncate mb-1" title={file.filename}>
                                            {file.filename}
                                        </h3>
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span className={getFileColor(file.file_type)}>
                                                {file.file_type.toUpperCase()}
                                            </span>
                                            <span>{file.file_size_display}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                                            <span>@{file.owner_username}</span>
                                            {file.shared_count > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Users size={12} />
                                                    {file.shared_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex border-t border-slate-700/50">
                                        <button
                                            onClick={() => handleDownload(file)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                        >
                                            <Download size={16} />
                                            Download
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border-l border-slate-700/50"
                                        >
                                            <Trash2 size={16} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-800/50">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Name</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Type</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Size</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Owner</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFiles.map((file) => (
                                        <tr key={file.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{getFileIcon(file.file_type)}</span>
                                                    <span className="text-white font-medium truncate max-w-xs">
                                                        {file.filename}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-sm ${getFileColor(file.file_type)}`}>
                                                {file.file_type.toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                {file.file_size_display}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                @{file.owner_username}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDownload(file)}
                                                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(file)}
                                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <div className="text-center py-16 bg-[#1e293b] rounded-2xl border border-slate-700/50">
                        <FolderOpen size={64} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No files found</h3>
                        <p className="text-slate-400">
                            {searchQuery ? 'Try a different search term' : 'Upload your first file to get started'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
