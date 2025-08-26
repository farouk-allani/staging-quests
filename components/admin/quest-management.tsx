'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { Search, Plus, MoreHorizontal, Eye, Edit, Play, Pause, XCircle, Trash2, Filter, Users, Calendar, Clock, Award, User, MapPin, Target, FileText, CheckCircle, AlertCircle, Compass, Trophy } from 'lucide-react';
import { QuestService } from '@/lib/services';
import { CreateQuestForm } from '@/components/admin/create-quest-form';
import { EditQuestForm } from '@/components/admin/edit-quest-form';
import type { Quest } from '@/types/quest';

function QuestManagement() {
  const { toast } = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [filteredQuests, setFilteredQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadQuests();
  }, []);

  useEffect(() => {
    filterQuests();
  }, [quests, searchTerm, selectedDifficulty]);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const data = await QuestService.getQuests();
      setQuests(data);
    } catch (error) {
      console.error('Failed to load quests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quests. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterQuests = () => {
    let filtered = quests;

    if (searchTerm) {
      filtered = filtered.filter(quest => 
        quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quest.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(quest => quest.difficulty === selectedDifficulty);
    }

    setFilteredQuests(filtered);
  };

  const handleDeleteQuest = async (questId: string) => {
    try {
      await QuestService.deleteQuest(questId);
      await loadQuests();
      toast({
        title: 'Success',
        description: 'Quest deleted successfully.',
      });
    } catch (error) {
      console.error('Failed to delete quest:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quest. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleActivateQuest = async (questId: string) => {
    try {
      await QuestService.activateQuest(questId);
      await loadQuests();
      toast({
        title: 'Success',
        description: 'Quest activated successfully.',
      });
    } catch (error) {
      console.error('Failed to activate quest:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate quest. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (quest: Quest) => {
    setSelectedQuest(quest);
    setIsDetailsDialogOpen(true);
  };

  const handleEditQuest = (quest: Quest) => {
    setSelectedQuest(quest);
    setIsEditDialogOpen(true);
  };

  const confirmDeleteQuest = (questId: string) => {
    setQuestToDelete(questId);
    setIsDeleteDialogOpen(true);
  };


   const getStatusBadge = (status: string | undefined) => {
    if (!status) {
      return <Badge variant="outline" className="font-mono">UNKNOWN</Badge>;
    }
    
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-mono"><CheckCircle className="w-3 h-3 mr-1" />PUBLISHED</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 font-mono"><AlertCircle className="w-3 h-3 mr-1" />DRAFT</Badge>;
      case 'archived':
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 font-mono"><XCircle className="w-3 h-3 mr-1" />ARCHIVED</Badge>;
      default:
        return <Badge variant="outline" className="font-mono">{status.toUpperCase()}</Badge>;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono font-semibold shadow-sm dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/50">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              BEGINNER
            </div>
          </Badge>
        );
      case 'intermediate':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-mono font-semibold shadow-sm dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/50">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              INTERMEDIATE
            </div>
          </Badge>
        );
      case 'advanced':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-mono font-semibold shadow-sm dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-700/50">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              ADVANCED
            </div>
          </Badge>
        );
      case 'expert':
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200 font-mono font-semibold shadow-sm dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700/50">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
              EXPERT
            </div>
          </Badge>
        );
      case 'master':
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono font-semibold shadow-sm dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700/50">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
              MASTER
            </div>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-mono font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              {difficulty.toUpperCase()}
            </div>
          </Badge>
        );
    }
  };



  const handleQuestAction = async (questId: string | number, action: string) => {
    try {
      // Call appropriate API based on action
      if (action === 'publish') {
        await QuestService.activateQuest(questId.toString());
      }
      // Reload quests to get updated data
      await loadQuests();
      toast({
        title: 'Success',
        description: `Quest ${action}ed successfully.`,
      });
    } catch (error) {
      console.error(`Failed to ${action} quest:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} quest. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
        <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
          <CardTitle className="flex items-center gap-2 font-mono">
            <div className="p-1 bg-cyan-500/20 rounded border border-dashed border-cyan-500/40">
              <Compass className="w-4 h-4 text-cyan-500" />
            </div>
            🎯 QUEST_MANAGEMENT
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="[SEARCH_QUESTS]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-mono border-dashed border-cyan-500/30 focus:border-solid"
              />
            </div>
            <Select value="all" onValueChange={() => {}}>
              <SelectTrigger className="w-40 font-mono border-dashed border-cyan-500/30">
                <SelectValue placeholder="[STATUS]" />
              </SelectTrigger>
              <SelectContent className="font-mono">
                <SelectItem value="all">[ALL_STATUS]</SelectItem>
                <SelectItem value="published">[PUBLISHED]</SelectItem>
                <SelectItem value="draft">[DRAFT]</SelectItem>
                <SelectItem value="archived">[ARCHIVED]</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-44 font-mono border-dashed border-cyan-500/30">
                <SelectValue placeholder="[DIFFICULTY]" />
              </SelectTrigger>
              <SelectContent className="font-mono">
                <SelectItem value="all">[ALL_LEVELS]</SelectItem>
                <SelectItem value="beginner">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    [BEGINNER]
                  </div>
                </SelectItem>
                <SelectItem value="intermediate">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    [INTERMEDIATE]
                  </div>
                </SelectItem>
                <SelectItem value="advanced">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    [ADVANCED]
                  </div>
                </SelectItem>
                <SelectItem value="expert">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    [EXPERT]
                  </div>
                </SelectItem>
                <SelectItem value="master">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    [MASTER]
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="font-mono border-2 border-dashed border-green-500/50 hover:border-solid bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              [CREATE_QUEST]
            </Button>
          </div>

          {/* Quests Table */}
          <div className="border-2 border-dashed border-cyan-500/20 rounded-lg overflow-hidden bg-gradient-to-br from-white/50 to-cyan-50/30 dark:from-gray-900/50 dark:to-cyan-900/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b-2 border-dashed border-cyan-500/30">
                  <TableHead className="font-mono font-semibold text-cyan-700 dark:text-cyan-300 py-4">[QUEST]</TableHead>
                  <TableHead className="font-mono font-semibold text-cyan-700 dark:text-cyan-300 py-4">[DIFFICULTY]</TableHead>
                  <TableHead className="font-mono font-semibold text-cyan-700 dark:text-cyan-300 py-4">[STATUS]</TableHead>
                  <TableHead className="font-mono font-semibold text-cyan-700 dark:text-cyan-300 py-4">[STATS]</TableHead>
                  <TableHead className="font-mono font-semibold text-cyan-700 dark:text-cyan-300 py-4">[UPDATED]</TableHead>
                  <TableHead className="font-mono font-semibold text-cyan-700 dark:text-cyan-300 py-4 text-center">[ACTIONS]</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuests.map((quest) => (
                  <TableRow key={quest.id} className="border-b border-dashed border-cyan-500/10 hover:bg-gradient-to-r hover:from-cyan-500/8 hover:to-blue-500/8 transition-all duration-200 group">
                    <TableCell className="py-4">
                      <div className="min-w-0">
                        <div className="font-semibold font-mono text-gray-900 dark:text-gray-100 mb-1">{quest.title}</div>
                        <div className="text-sm text-muted-foreground font-mono line-clamp-2 max-w-sm">
                          {quest.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">{getDifficultyBadge(quest.difficulty)}</TableCell>
                    <TableCell className="py-4">{getStatusBadge(quest.status)}</TableCell>
                    <TableCell className="py-4">
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded border border-dashed border-yellow-300/50">
                          <Trophy className="w-3 h-3 text-yellow-600" />
                          <span className="font-semibold">{quest.points}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-dashed border-blue-300/50">
                          <Users className="w-3 h-3 text-blue-600" />
                          <span className="font-semibold">{quest.completions}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded border border-dashed border-green-300/50">
                          <Clock className="w-3 h-3 text-green-600" />
                          <span className="font-semibold">{quest.estimatedTime}m</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded border border-dashed border-purple-300/50">
                          <Calendar className="w-3 h-3 text-purple-600" />
                          <span className="font-semibold">{quest.updatedAt ? formatDistanceToNow(new Date(quest.updatedAt), { addSuffix: true }) : 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm py-4 text-muted-foreground">{quest.updatedAt ? formatDistanceToNow(new Date(quest.updatedAt), { addSuffix: true }) : 'N/A'}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(quest)}
                          className="h-8 px-3 border border-dashed border-green-500/30 hover:border-solid hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 hover:text-green-700 transition-all duration-200"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditQuest(quest)}
                          className="h-8 px-3 border border-dashed border-blue-500/30 hover:border-solid hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 hover:text-blue-700 transition-all duration-200"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 border border-dashed border-cyan-500/30 hover:border-solid hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all duration-200">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="font-mono border-2 border-dashed border-cyan-500/30">
                            <DropdownMenuLabel>[ACTIONS]</DropdownMenuLabel>
                            <DropdownMenuSeparator className="border-dashed border-cyan-500/20" />
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              [VIEW]
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditQuest(quest)}>
                              <Edit className="mr-2 h-4 w-4" />
                              [EDIT]
                            </DropdownMenuItem>
                            {quest.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleQuestAction(quest.id, 'publish')} className="text-green-600">
                                <Play className="mr-2 h-4 w-4" />
                                [PUBLISH]
                              </DropdownMenuItem>
                            )}
                            {quest.status === 'published' && (
                              <DropdownMenuItem onClick={() => handleQuestAction(quest.id, 'draft')} className="text-yellow-600">
                                <Pause className="mr-2 h-4 w-4" />
                                [UNPUBLISH]
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleQuestAction(quest.id, 'archive')} className="text-orange-600">
                              <XCircle className="mr-2 h-4 w-4" />
                              [ARCHIVE]
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="border-dashed border-cyan-500/20" />
                            <DropdownMenuItem onClick={() => confirmDeleteQuest(quest.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              [DELETE]
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-dashed border-blue-500/20">
              <div className="text-2xl font-bold font-mono text-blue-500">{quests.length}</div>
              <div className="text-sm text-muted-foreground font-mono">TOTAL_QUESTS</div>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-dashed border-green-500/20">
              <div className="text-2xl font-bold font-mono text-green-500">{quests.filter(q => q.status === 'published').length}</div>
              <div className="text-sm text-muted-foreground font-mono">PUBLISHED</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4 rounded-lg border border-dashed border-yellow-500/20">
              <div className="text-2xl font-bold font-mono text-yellow-500">{quests.filter(q => q.status === 'draft').length}</div>
              <div className="text-sm text-muted-foreground font-mono">DRAFTS</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-dashed border-purple-500/20">
              <div className="text-2xl font-bold font-mono text-purple-500">{quests.reduce((sum, q) => sum + (q.completions || 0), 0)}</div>
              <div className="text-sm text-muted-foreground font-mono">COMPLETIONS</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Quest Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Quest</DialogTitle>
            <DialogDescription>
              Create a new quest for users to complete and earn rewards.
            </DialogDescription>
          </DialogHeader>
          <CreateQuestForm
            onSuccess={() => {
              setIsCreateDialogOpen(false);
              loadQuests();
            }}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Quest Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quest</DialogTitle>
            <DialogDescription>
              Modify quest details and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedQuest && (
            <EditQuestForm
              quest={selectedQuest}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                loadQuests();
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Quest Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quest Details</DialogTitle>
          </DialogHeader>
          {selectedQuest && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedQuest.title}</h3>
                  <p className="text-gray-600 mb-4">{selectedQuest.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Award className="w-6 h-6 mx-auto mb-1 text-yellow-600" />
                      <div className="text-sm text-gray-600">Points</div>
                      <div className="font-semibold">{selectedQuest.points}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="font-semibold">{selectedQuest.estimatedTime}m</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Users className="w-6 h-6 mx-auto mb-1 text-green-600" />
                      <div className="text-sm text-gray-600">Completions</div>
                      <div className="font-semibold">{selectedQuest.completions || 0}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-6 h-6 mx-auto mb-1 text-purple-600" />
                      <div className="text-sm text-gray-600">Updated</div>
                      <div className="font-semibold text-xs">{selectedQuest.updatedAt ? formatDistanceToNow(new Date(selectedQuest.updatedAt), { addSuffix: true }) : 'N/A'}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getDifficultyColor(selectedQuest.difficulty)}>
                      {selectedQuest.difficulty}
                    </Badge>
                    {getStatusBadge(selectedQuest.status)}
                  </div>

                  {selectedQuest.requirements && selectedQuest.requirements.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Requirements</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {selectedQuest.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedQuest.steps && selectedQuest.steps.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Steps</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        {selectedQuest.steps.map((step, index) => (
                          <li key={index} className="text-sm">
                            <span className="font-medium">{step.title}</span>
                            {step.description && (
                              <p className="text-gray-600 ml-4 mt-1">{step.description}</p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsDetailsDialogOpen(false);
              handleEditQuest(selectedQuest!);
            }}>
              Edit Quest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quest
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setQuestToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (questToDelete) {
                  handleDeleteQuest(questToDelete);
                  setQuestToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { QuestManagement };
export default QuestManagement;