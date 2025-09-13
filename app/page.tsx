'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, FileText, CheckCircle, AlertCircle, X, User, Briefcase, 
  GraduationCap, Code, Target, TrendingUp, Brain, Users, Calendar,
  Award, BookOpen, Zap, Star, Eye, MessageSquare, DollarSign,
  BarChart3, Lightbulb, Rocket, Shield, Plus, Minus, Download,
  Play, Pause, RotateCcw, Settings, Home, Activity
} from 'lucide-react';
import { extractTextFromFile, validateFileType, formatFileSize } from '@/lib/fileUtils';
import { 
  parseResumeText, 
  analyzeJobMatch, 
  performSkillGapAnalysis, 
  generateLearningPath,
  generateCareerDNA,
  generateInterviewQuestions,
  ProcessedResumeData,
  SkillGapAnalysis,
  LearningPath,
  CareerDNA
} from '@/lib/huggingface';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
  };
  summary: string;
  experience: Array<{
    id: number;
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    id: number;
    degree: string;
    institution: string;
    year: string;
    gpa: string;
  }>;
  skills: string[];
  projects: Array<{
    id: number;
    name: string;
    description: string;
    technologies: string;
    link: string;
  }>;
}

export default function CareerForgeCopilot() {
  // Main state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [processedResume, setProcessedResume] = useState<ProcessedResumeData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  
  // Resume upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Job analysis state
  const [jobDescription, setJobDescription] = useState('');
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [skillGapData, setSkillGapData] = useState<SkillGapAnalysis | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [careerDNA, setCareerDNA] = useState<CareerDNA | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  
  // Resume builder state
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: []
  });
  const [builderStep, setBuilderStep] = useState(0);
  
  // Recruiter simulator state
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  // Handle file upload
  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);
    
    if (!validateFileType(file)) {
      setUploadError('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Extract and process resume
      const extractedText = await extractTextFromFile(file);
      const processedData = await parseResumeText(extractedText);
      
      setUploadProgress(100);
      setTimeout(() => {
        setProcessedResume(processedData);
        setIsProcessing(false);
        setUserXP(prev => prev + 100);
        
        // Auto-populate resume builder with extracted data
        setResumeData(prev => ({
          ...prev,
          personalInfo: processedData.personalInfo,
          summary: processedData.summary,
          skills: processedData.skills
        }));
      }, 500);

    } catch (error) {
      console.error('Error processing resume:', error);
      setUploadError('Failed to process resume. Please try again.');
      setIsProcessing(false);
      setUploadProgress(0);
    }
  }, []);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  // Analyze job match
  const analyzeJob = async () => {
    if (!processedResume || !jobDescription.trim()) return;
    
    setIsProcessing(true);
    try {
      const analysis = await analyzeJobMatch(processedResume.extractedText, jobDescription);
      setAtsScore(analysis.atsScore);
      setSuggestions(analysis.suggestions);
      
      const skillGap = await performSkillGapAnalysis(processedResume.skills, jobDescription);
      setSkillGapData(skillGap);
      
      const path = await generateLearningPath(skillGap.missingSkills, 'intermediate');
      setLearningPath(path);
      
      const dna = await generateCareerDNA(processedResume);
      setCareerDNA(dna);
      
      const questions = await generateInterviewQuestions(jobDescription, processedResume.skills);
      setInterviewQuestions(questions);
      
      setUserXP(prev => prev + 200);
    } catch (error) {
      console.error('Error analyzing job:', error);
    }
    setIsProcessing(false);
  };

  // Resume builder functions
  const addExperience = () => {
    const newExp = {
      id: Date.now(),
      title: '',
      company: '',
      duration: '',
      description: ''
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const removeExperience = (id: number) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const updateExperience = (id: number, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addEducation = () => {
    const newEdu = {
      id: Date.now(),
      degree: '',
      institution: '',
      year: '',
      gpa: ''
    };
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const removeEducation = (id: number) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const updateEducation = (id: number, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const addProject = () => {
    const newProject = {
      id: Date.now(),
      name: '',
      description: '',
      technologies: '',
      link: ''
    };
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));
  };

  const removeProject = (id: number) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }));
  };

  const updateProject = (id: number, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => 
        proj.id === id ? { ...proj, [field]: value } : proj
      )
    }));
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !resumeData.skills.includes(skill.trim())) {
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Recruiter simulator
  const runRecruiterSimulator = () => {
    setSimulatorRunning(true);
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSimulatorRunning(false);
          setUserXP(prevXP => prevXP + 150);
          
          // Generate heatmap data
          setHeatmapData([
            { section: 'Name', attention: 95, x: 20, y: 10 },
            { section: 'Contact', attention: 85, x: 20, y: 15 },
            { section: 'Summary', attention: 70, x: 20, y: 25 },
            { section: 'Experience', attention: 90, x: 20, y: 40 },
            { section: 'Skills', attention: 80, x: 20, y: 70 },
            { section: 'Education', attention: 60, x: 20, y: 85 }
          ]);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  // Complete learning task
  const completeTask = (taskId: number) => {
    if (learningPath) {
      setLearningPath(prev => ({
        ...prev!,
        tasks: prev!.tasks.map(task => 
          task.id === taskId ? { ...task, completed: true } : task
        )
      }));
      setUserXP(prev => prev + 50);
    }
  };

  // Calculate user level
  React.useEffect(() => {
    const newLevel = Math.floor(userXP / 500) + 1;
    if (newLevel > userLevel) {
      setUserLevel(newLevel);
    }
  }, [userXP, userLevel]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Upload Resume', icon: Upload },
    { id: 'builder', label: 'Resume Builder', icon: FileText },
    { id: 'optimizer', label: 'Smart Optimizer', icon: Zap },
    { id: 'skills', label: 'Skill Gap Analysis', icon: Target },
    { id: 'growth', label: 'Growth Engine', icon: TrendingUp },
    { id: 'simulator', label: 'Recruiter Simulator', icon: Eye },
    { id: 'dna', label: 'Career DNA', icon: Brain },
    { id: 'interview', label: 'Interview Prep', icon: MessageSquare },
    { id: 'salary', label: 'Salary Insights', icon: DollarSign }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">CareerForge</h1>
              <p className="text-sm text-gray-500">AI Career Copilot</p>
            </div>
          </div>
          
          {/* User Progress */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Level {userLevel}</span>
              <span className="text-xs text-blue-700">{userXP} XP</span>
            </div>
            <Progress value={(userXP % 500) / 5} className="h-2" />
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Career Dashboard</h2>
                <p className="text-gray-600 mt-2">Your AI-powered career development hub</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">ATS Score</p>
                        <p className="text-2xl font-bold text-blue-600">{atsScore || '--'}%</p>
                      </div>
                      <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Skills Match</p>
                        <p className="text-2xl font-bold text-green-600">{skillGapData?.matchPercentage || '--'}%</p>
                      </div>
                      <Target className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Learning Tasks</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {learningPath?.tasks.filter(t => t.completed).length || 0}/{learningPath?.tasks.length || 0}
                        </p>
                      </div>
                      <BookOpen className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Career Level</p>
                        <p className="text-2xl font-bold text-orange-600">Level {userLevel}</p>
                      </div>
                      <Award className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              {processedResume && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm">Resume uploaded and processed successfully</span>
                      </div>
                      {atsScore && (
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          <span className="text-sm">ATS analysis completed - Score: {atsScore}%</span>
                        </div>
                      )}
                      {skillGapData && (
                        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                          <Target className="w-5 h-5 text-purple-600" />
                          <span className="text-sm">Skill gap analysis completed - {skillGapData.matchPercentage}% match</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Upload Resume */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Upload Resume</h2>
                <p className="text-gray-600 mt-2">Upload your resume to get started with AI-powered insights</p>
              </div>

              <Card>
                <CardContent className="p-6">
                  {!uploadedFile && !isProcessing && (
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Drop your resume here
                      </h3>
                      <p className="text-gray-500 mb-4">
                        or click to browse files
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileInput}
                        className="hidden"
                        id="resume-upload"
                        disabled={isProcessing}
                      />
                      <label htmlFor="resume-upload">
                        <Button className="cursor-pointer" disabled={isProcessing}>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </Button>
                      </label>
                      <p className="text-xs text-gray-400 mt-4">
                        Supports PDF, DOC, DOCX, TXT (max 10MB)
                      </p>
                    </div>
                  )}

                  {uploadedFile && !isProcessing && (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">{uploadedFile.name}</p>
                          <p className="text-sm text-green-700">{formatFileSize(uploadedFile.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUploadedFile(null);
                            setUploadError(null);
                            setUploadProgress(0);
                          }}
                          className="text-green-700 hover:text-green-900"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Processing resume...</p>
                          <p className="text-sm text-gray-500">AI is analyzing your resume</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {processedResume && (
                <Card>
                  <CardHeader>
                    <CardTitle>Processing Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Extracted Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Name:</span> {processedResume.personalInfo.name || 'Not found'}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {processedResume.personalInfo.email || 'Not found'}
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {processedResume.personalInfo.phone || 'Not found'}
                          </div>
                          <div>
                            <span className="font-medium">Skills Found:</span> {processedResume.skills.length}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Extracted Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {processedResume.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Resume Builder */}
          {activeTab === 'builder' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Resume Builder</h2>
                <p className="text-gray-600 mt-2">Build your professional resume step by step</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Builder Steps */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="w-5 h-5" />
                        <span>Personal Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={resumeData.personalInfo.name}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, name: e.target.value }
                            }))}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={resumeData.personalInfo.email}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, email: e.target.value }
                            }))}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={resumeData.personalInfo.phone}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, phone: e.target.value }
                            }))}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={resumeData.personalInfo.location}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, location: e.target.value }
                            }))}
                            placeholder="New York, NY"
                          />
                        </div>
                        <div>
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <Input
                            id="linkedin"
                            value={resumeData.personalInfo.linkedin}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                            }))}
                            placeholder="linkedin.com/in/johndoe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={resumeData.personalInfo.website}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, website: e.target.value }
                            }))}
                            placeholder="johndoe.com"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Professional Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="w-5 h-5" />
                        <span>Professional Summary</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={resumeData.summary}
                        onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                        placeholder="Write a compelling professional summary that highlights your key achievements and career goals..."
                        rows={4}
                      />
                    </CardContent>
                  </Card>

                  {/* Experience */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-5 h-5" />
                          <span>Work Experience</span>
                        </div>
                        <Button onClick={addExperience} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Experience
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resumeData.experience.map((exp, index) => (
                        <div key={exp.id} className="p-4 border rounded-lg space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">Experience #{index + 1}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExperience(exp.id)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Job Title</Label>
                              <Input
                                value={exp.title}
                                onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                                placeholder="Software Engineer"
                              />
                            </div>
                            <div>
                              <Label>Company</Label>
                              <Input
                                value={exp.company}
                                onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                placeholder="Tech Corp"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Duration</Label>
                            <Input
                              value={exp.duration}
                              onChange={(e) => updateExperience(exp.id, 'duration', e.target.value)}
                              placeholder="Jan 2020 - Present"
                            />
                          </div>
                          <div>
                            <Label>Description (Use STAR method)</Label>
                            <Textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                              placeholder="• Situation: Describe the context
• Task: Explain what needed to be done
• Action: Detail what you did
• Result: Quantify the outcome"
                              rows={4}
                            />
                          </div>
                        </div>
                      ))}
                      {resumeData.experience.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No work experience added yet</p>
                          <p className="text-sm">Click "Add Experience" to get started</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Education */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="w-5 h-5" />
                          <span>Education</span>
                        </div>
                        <Button onClick={addEducation} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Education
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resumeData.education.map((edu, index) => (
                        <div key={edu.id} className="p-4 border rounded-lg space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">Education #{index + 1}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEducation(edu.id)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Degree</Label>
                              <Input
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                placeholder="Bachelor of Science in Computer Science"
                              />
                            </div>
                            <div>
                              <Label>Institution</Label>
                              <Input
                                value={edu.institution}
                                onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                                placeholder="University of Technology"
                              />
                            </div>
                            <div>
                              <Label>Year</Label>
                              <Input
                                value={edu.year}
                                onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                                placeholder="2015 - 2019"
                              />
                            </div>
                            <div>
                              <Label>GPA (Optional)</Label>
                              <Input
                                value={edu.gpa}
                                onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                                placeholder="3.8/4.0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {resumeData.education.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No education added yet</p>
                          <p className="text-sm">Click "Add Education" to get started</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Skills */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Code className="w-5 h-5" />
                        <span>Skills</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Add a skill (e.g., JavaScript, Project Management)"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addSkill(e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <Button
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              addSkill(input.value);
                              input.value = '';
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {resumeData.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                              <span>{skill}</span>
                              <button
                                onClick={() => removeSkill(skill)}
                                className="ml-1 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        {resumeData.skills.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Code className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No skills added yet</p>
                            <p className="text-sm">Add your technical and soft skills</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Projects */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="w-5 h-5" />
                          <span>Projects</span>
                        </div>
                        <Button onClick={addProject} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Project
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resumeData.projects.map((project, index) => (
                        <div key={project.id} className="p-4 border rounded-lg space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">Project #{index + 1}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProject(project.id)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Project Name</Label>
                              <Input
                                value={project.name}
                                onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                                placeholder="E-commerce Platform"
                              />
                            </div>
                            <div>
                              <Label>Technologies</Label>
                              <Input
                                value={project.technologies}
                                onChange={(e) => updateProject(project.id, 'technologies', e.target.value)}
                                placeholder="React, Node.js, MongoDB"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Project Link (Optional)</Label>
                            <Input
                              value={project.link}
                              onChange={(e) => updateProject(project.id, 'link', e.target.value)}
                              placeholder="https://github.com/username/project"
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={project.description}
                              onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                              placeholder="Describe your project, your role, and the impact it had..."
                              rows={3}
                            />
                          </div>
                        </div>
                      ))}
                      {resumeData.projects.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No projects added yet</p>
                          <p className="text-sm">Showcase your best work and side projects</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Resume Preview */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Resume Preview</CardTitle>
                      <CardDescription>Live preview of your resume</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white border rounded-lg p-6 text-sm space-y-4 max-h-96 overflow-y-auto">
                        {/* Header */}
                        <div className="text-center border-b pb-4">
                          <h1 className="text-xl font-bold">{resumeData.personalInfo.name || 'Your Name'}</h1>
                          <div className="text-gray-600 space-y-1">
                            {resumeData.personalInfo.email && <p>{resumeData.personalInfo.email}</p>}
                            {resumeData.personalInfo.phone && <p>{resumeData.personalInfo.phone}</p>}
                            {resumeData.personalInfo.location && <p>{resumeData.personalInfo.location}</p>}
                          </div>
                        </div>

                        {/* Summary */}
                        {resumeData.summary && (
                          <div>
                            <h2 className="font-bold text-gray-900 mb-2">PROFESSIONAL SUMMARY</h2>
                            <p className="text-gray-700">{resumeData.summary}</p>
                          </div>
                        )}

                        {/* Experience */}
                        {resumeData.experience.length > 0 && (
                          <div>
                            <h2 className="font-bold text-gray-900 mb-2">EXPERIENCE</h2>
                            <div className="space-y-3">
                              {resumeData.experience.map((exp) => (
                                <div key={exp.id}>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-semibold">{exp.title || 'Job Title'}</h3>
                                      <p className="text-gray-600">{exp.company || 'Company Name'}</p>
                                    </div>
                                    <span className="text-gray-500 text-xs">{exp.duration || 'Duration'}</span>
                                  </div>
                                  {exp.description && (
                                    <div className="mt-1 text-gray-700 whitespace-pre-line">
                                      {exp.description}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Education */}
                        {resumeData.education.length > 0 && (
                          <div>
                            <h2 className="font-bold text-gray-900 mb-2">EDUCATION</h2>
                            <div className="space-y-2">
                              {resumeData.education.map((edu) => (
                                <div key={edu.id}>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-semibold">{edu.degree || 'Degree'}</h3>
                                      <p className="text-gray-600">{edu.institution || 'Institution'}</p>
                                    </div>
                                    <span className="text-gray-500 text-xs">{edu.year || 'Year'}</span>
                                  </div>
                                  {edu.gpa && <p className="text-gray-600 text-xs">GPA: {edu.gpa}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Skills */}
                        {resumeData.skills.length > 0 && (
                          <div>
                            <h2 className="font-bold text-gray-900 mb-2">SKILLS</h2>
                            <p className="text-gray-700">{resumeData.skills.join(', ')}</p>
                          </div>
                        )}

                        {/* Projects */}
                        {resumeData.projects.length > 0 && (
                          <div>
                            <h2 className="font-bold text-gray-900 mb-2">PROJECTS</h2>
                            <div className="space-y-2">
                              {resumeData.projects.map((project) => (
                                <div key={project.id}>
                                  <h3 className="font-semibold">{project.name || 'Project Name'}</h3>
                                  {project.technologies && (
                                    <p className="text-gray-600 text-xs">Technologies: {project.technologies}</p>
                                  )}
                                  {project.description && (
                                    <p className="text-gray-700 text-xs">{project.description}</p>
                                  )}
                                  {project.link && (
                                    <p className="text-blue-600 text-xs">{project.link}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Resume
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Smart Optimizer */}
          {activeTab === 'optimizer' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Smart Resume Optimizer</h2>
                <p className="text-gray-600 mt-2">Optimize your resume for specific job opportunities</p>
              </div>

              {!processedResume ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Resume First</h3>
                    <p className="text-gray-500 mb-4">Please upload your resume to use the optimizer</p>
                    <Button onClick={() => setActiveTab('upload')}>
                      Go to Upload
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Job Description Input */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Job Description</CardTitle>
                      <CardDescription>Paste the job description you want to optimize for</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here..."
                        rows={10}
                      />
                      <Button 
                        onClick={analyzeJob} 
                        disabled={!jobDescription.trim() || isProcessing}
                        className="w-full"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Analyze & Optimize
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Analysis Results */}
                  <div className="space-y-6">
                    {atsScore !== null && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Shield className="w-5 h-5" />
                            <span>ATS Score</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className={`text-4xl font-bold mb-2 ${
                              atsScore >= 80 ? 'text-green-600' : 
                              atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {atsScore}%
                            </div>
                            <Progress value={atsScore} className="h-3 mb-4" />
                            <p className="text-sm text-gray-600">
                              {atsScore >= 80 ? 'Excellent match!' : 
                               atsScore >= 60 ? 'Good match with room for improvement' : 
                               'Needs significant optimization'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {suggestions.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Lightbulb className="w-5 h-5" />
                            <span>Optimization Suggestions</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {suggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm">{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skill Gap Analysis */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Skill Gap Analysis</h2>
                <p className="text-gray-600 mt-2">Identify skill gaps and get personalized recommendations</p>
              </div>

              {!skillGapData ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analyze Job First</h3>
                    <p className="text-gray-500 mb-4">Upload your resume and analyze a job description to see skill gaps</p>
                    <Button onClick={() => setActiveTab('optimizer')}>
                      Go to Optimizer
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Skill Match Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className={`text-3xl font-bold mb-2 ${
                          skillGapData.matchPercentage >= 80 ? 'text-green-600' : 
                          skillGapData.matchPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {skillGapData.matchPercentage}%
                        </div>
                        <p className="text-sm text-gray-600">Overall Match</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {skillGapData.currentSkills.length}
                        </div>
                        <p className="text-sm text-gray-600">Your Skills</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-red-600 mb-2">
                          {skillGapData.missingSkills.length}
                        </div>
                        <p className="text-sm text-gray-600">Skills to Learn</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Radar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills Comparison</CardTitle>
                      <CardDescription>Your skills vs job requirements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={skillGapData.requiredSkills.map(required => {
                            const current = skillGapData.currentSkills.find(skill => 
                              skill.skill.toLowerCase() === required.skill.toLowerCase()
                            );
                            return {
                              skill: required.skill,
                              current: current?.level || 0,
                              required: required.level
                            };
                          })}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
                            <Radar
                              name="Your Skills"
                              dataKey="current"
                              stroke="#3b82f6"
                              fill="#3b82f6"
                              fillOpacity={0.3}
                              strokeWidth={2}
                            />
                            <Radar
                              name="Required"
                              dataKey="required"
                              stroke="#ef4444"
                              fill="#ef4444"
                              fillOpacity={0.1}
                              strokeWidth={2}
                              strokeDasharray="5 5"
                            />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Missing Skills */}
                  {skillGapData.missingSkills.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span>Skills to Develop</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {skillGapData.missingSkills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="border-red-200 text-red-700 p-2">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Your Strengths */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Your Strengths</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {skillGapData.currentSkills.slice(0, 9).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 p-2">
                            {skill.skill} ({skill.level}/10)
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Growth Engine */}
          {activeTab === 'growth' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Personalized Growth Engine</h2>
                <p className="text-gray-600 mt-2">Your AI-powered learning path to career success</p>
              </div>

              {!learningPath ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Learning Path</h3>
                    <p className="text-gray-500 mb-4">Complete skill gap analysis to get your personalized learning path</p>
                    <Button onClick={() => setActiveTab('skills')}>
                      Analyze Skills First
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Learning Path Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Rocket className="w-5 h-5" />
                        <span>{learningPath.title}</span>
                      </CardTitle>
                      <CardDescription>
                        Duration: {learningPath.duration} • {learningPath.tasks.filter(t => t.completed).length}/{learningPath.tasks.length} completed
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress 
                        value={(learningPath.tasks.filter(t => t.completed).length / learningPath.tasks.length) * 100} 
                        className="h-3"
                      />
                    </CardContent>
                  </Card>

                  {/* Learning Tasks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {learningPath.tasks.map((task) => (
                      <Card key={task.id} className={task.completed ? 'bg-green-50 border-green-200' : ''}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                task.completed ? 'bg-green-600' : 'bg-gray-200'
                              }`}>
                                {task.completed ? (
                                  <CheckCircle className="w-5 h-5 text-white" />
                                ) : (
                                  <span className="text-sm font-medium text-gray-600">{task.id}</span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{task.title}</h3>
                                <p className="text-sm text-gray-500">{task.duration}</p>
                              </div>
                            </div>
                            <Badge variant={
                              task.type === 'course' ? 'default' :
                              task.type === 'project' ? 'secondary' : 'outline'
                            }>
                              {task.type}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4">{task.description}</p>
                          
                          {!task.completed && (
                            <Button 
                              onClick={() => completeTask(task.id)}
                              size="sm"
                              className="w-full"
                            >
                              Mark Complete (+50 XP)
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* XP Progress */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Star className="w-5 h-5" />
                        <span>Your Progress</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{userXP}</div>
                          <p className="text-sm text-gray-600">Total XP</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{userLevel}</div>
                          <p className="text-sm text-gray-600">Current Level</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {learningPath.tasks.filter(t => t.completed).length}
                          </div>
                          <p className="text-sm text-gray-600">Tasks Completed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Recruiter Simulator */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Recruiter Simulator</h2>
                <p className="text-gray-600 mt-2">See how recruiters view your resume in the first 6 seconds</p>
              </div>

              {!processedResume ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Resume First</h3>
                    <p className="text-gray-500 mb-4">Please upload your resume to run the simulator</p>
                    <Button onClick={() => setActiveTab('upload')}>
                      Go to Upload
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Simulator Controls */}
                  <Card>
                    <CardHeader>
                      <CardTitle>6-Second Scan Simulation</CardTitle>
                      <CardDescription>
                        Simulate how a recruiter scans your resume in the critical first 6 seconds
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <Button 
                          onClick={runRecruiterSimulator}
                          disabled={simulatorRunning}
                          className="flex items-center space-x-2"
                        >
                          {simulatorRunning ? (
                            <>
                              <Pause className="w-4 h-4" />
                              <span>Scanning...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              <span>Start 6-Second Scan</span>
                            </>
                          )}
                        </Button>
                        
                        {simulatorRunning && (
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Scan Progress</span>
                              <span>{Math.round(scanProgress)}%</span>
                            </div>
                            <Progress value={scanProgress} className="h-2" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Heatmap Results */}
                  {heatmapData.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Attention Heatmap</CardTitle>
                          <CardDescription>Areas that caught the recruiter's attention</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {heatmapData.map((item, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="font-medium">{item.section}</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        item.attention >= 80 ? 'bg-green-500' :
                                        item.attention >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${item.attention}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">{item.attention}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Recruiter Insights</CardTitle>
                          <CardDescription>What recruiters noticed first</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <h4 className="font-medium text-green-900 mb-1">✓ Strong Points</h4>
                              <ul className="text-sm text-green-700 space-y-1">
                                <li>• Clear contact information</li>
                                <li>• Well-structured experience section</li>
                                <li>• Relevant skills highlighted</li>
                              </ul>
                            </div>
                            
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <h4 className="font-medium text-yellow-900 mb-1">⚠ Areas for Improvement</h4>
                              <ul className="text-sm text-yellow-700 space-y-1">
                                <li>• Professional summary could be more prominent</li>
                                <li>• Education section needs more attention</li>
                                <li>• Consider adding more quantified achievements</li>
                              </ul>
                            </div>
                            
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="font-medium text-blue-900 mb-1">💡 Recommendations</h4>
                              <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Move key achievements to the top</li>
                                <li>• Use bullet points for better scanning</li>
                                <li>• Add more industry keywords</li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Career DNA */}
          {activeTab === 'dna' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Career DNA Profile</h2>
                <p className="text-gray-600 mt-2">Your unique professional fingerprint and career insights</p>
              </div>

              {!careerDNA ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Career DNA</h3>
                    <p className="text-gray-500 mb-4">Upload your resume and analyze a job to generate your Career DNA</p>
                    <Button onClick={() => setActiveTab('optimizer')}>
                      Start Analysis
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Career Archetype */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Brain className="w-5 h-5" />
                        <span>Your Career Archetype</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Brain className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{careerDNA.archetype}</h3>
                        <p className="text-gray-600">Your professional personality type</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <span>Your Strengths</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {careerDNA.strengths.map((strength, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium text-gray-900">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Growth Areas */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                          <span>Growth Areas</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {careerDNA.growthAreas.map((area, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="font-medium text-gray-900">{area}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Career Stage & Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Activity className="w-5 h-5 text-purple-500" />
                          <span>Career Stage</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 mb-2">{careerDNA.careerStage}</div>
                          <p className="text-gray-600">Your current career level</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Rocket className="w-5 h-5 text-orange-500" />
                          <span>Recommended Roles</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {careerDNA.recommendedRoles.map((role, index) => (
                            <Badge key={index} variant="outline" className="mr-2 mb-2">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Share Profile */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Share Your Career DNA</CardTitle>
                      <CardDescription>Share your professional profile with others</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <Input 
                          value={`https://careerforge.ai/profile/${btoa(careerDNA.archetype)}`}
                          readOnly
                          className="flex-1"
                        />
                        <Button>
                          Copy Link
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Interview Prep */}
          {activeTab === 'interview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Interview Preparation</h2>
                <p className="text-gray-600 mt-2">Practice with AI-generated questions tailored to your profile</p>
              </div>

              {interviewQuestions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Interview Questions</h3>
                    <p className="text-gray-500 mb-4">Analyze a job description to get personalized interview questions</p>
                    <Button onClick={() => setActiveTab('optimizer')}>
                      Analyze Job First
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Interview Questions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MessageSquare className="w-5 h-5" />
                        <span>Practice Questions</span>
                      </CardTitle>
                      <CardDescription>
                        AI-generated questions based on your resume and target job
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {interviewQuestions.map((question, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 mb-2">{question}</p>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline">
                                    Practice Answer
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    Get Tips
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* STAR Method Guide */}
                  <Card>
                    <CardHeader>
                      <CardTitle>STAR Method Guide</CardTitle>
                      <CardDescription>Structure your answers for maximum impact</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-bold text-blue-900 mb-2">Situation</h4>
                          <p className="text-sm text-blue-700">Set the context and background</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-bold text-green-900 mb-2">Task</h4>
                          <p className="text-sm text-green-700">Describe what needed to be done</p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <h4 className="font-bold text-yellow-900 mb-2">Action</h4>
                          <p className="text-sm text-yellow-700">Explain what you did specifically</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-bold text-purple-900 mb-2">Result</h4>
                          <p className="text-sm text-purple-700">Share the outcome and impact</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Salary Insights */}
          {activeTab === 'salary' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Salary Insights</h2>
                <p className="text-gray-600 mt-2">Market-driven compensation analysis and negotiation tips</p>
              </div>

              {!processedResume ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Resume First</h3>
                    <p className="text-gray-500 mb-4">Please upload your resume to get salary insights</p>
                    <Button onClick={() => setActiveTab('upload')}>
                      Go to Upload
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Salary Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">$85,000</div>
                        <p className="text-sm text-gray-600">Estimated Base Salary</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">$95,000</div>
                        <p className="text-sm text-gray-600">Market Average</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">$110,000</div>
                        <p className="text-sm text-gray-600">Target Salary</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Salary Range Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Salary Range Analysis</CardTitle>
                      <CardDescription>Based on your skills and experience level</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { level: 'Entry', min: 60000, avg: 70000, max: 80000 },
                            { level: 'Mid', min: 75000, avg: 85000, max: 95000 },
                            { level: 'Senior', min: 95000, avg: 110000, max: 130000 },
                            { level: 'Lead', min: 120000, avg: 140000, max: 160000 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="level" />
                            <YAxis />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Bar dataKey="min" fill="#e5e7eb" name="Minimum" />
                            <Bar dataKey="avg" fill="#3b82f6" name="Average" />
                            <Bar dataKey="max" fill="#1d4ed8" name="Maximum" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skills Value */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills Market Value</CardTitle>
                      <CardDescription>How your skills impact your earning potential</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {processedResume.skills.slice(0, 6).map((skill, index) => {
                          const demand = Math.floor(Math.random() * 40) + 60; // 60-100%
                          const salaryImpact = Math.floor(Math.random() * 15000) + 5000; // $5k-20k
                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Badge variant="secondary">{skill}</Badge>
                                <div className="text-sm">
                                  <span className="font-medium">Market Demand: </span>
                                  <span className={demand >= 80 ? 'text-green-600' : demand >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                                    {demand}%
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm font-medium text-green-600">
                                +${salaryImpact.toLocaleString()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Negotiation Tips */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Negotiation Strategy</CardTitle>
                      <CardDescription>Tips to maximize your compensation package</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Before the Negotiation</h4>
                          <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                              <span>Research market rates for your role and location</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                              <span>Document your achievements and quantify your impact</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                              <span>Consider the total compensation package, not just base salary</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">During the Negotiation</h4>
                          <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                              <span>Present your case with confidence and data</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                              <span>Be flexible and consider non-monetary benefits</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                              <span>Ask for time to consider the offer if needed</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}