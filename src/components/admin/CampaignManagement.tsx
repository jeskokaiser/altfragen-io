import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Calendar, Tag, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { CampaignService, Campaign, CampaignInsert } from '@/services/CampaignService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const CampaignManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<Partial<CampaignInsert>>({
    title: '',
    description: '',
    code: '',
    discount_percentage: null,
    active: true,
    start_date: null,
    end_date: null,
    priority: 0,
    display_type: 'banner'
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await CampaignService.getAllCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Fehler beim Laden der Kampagnen');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.description) {
        toast.error('Titel und Beschreibung sind erforderlich');
        return;
      }

      if (editingCampaign) {
        await CampaignService.updateCampaign(editingCampaign.id, formData);
        toast.success('Kampagne erfolgreich aktualisiert');
      } else {
        await CampaignService.createCampaign(formData as Omit<CampaignInsert, 'id' | 'created_at' | 'updated_at' | 'created_by'>);
        toast.success('Kampagne erfolgreich erstellt');
      }

      setShowDialog(false);
      resetForm();
      loadCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Fehler beim Speichern der Kampagne');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bist du sicher, dass du diese Kampagne löschen möchtest?')) {
      return;
    }

    try {
      await CampaignService.deleteCampaign(id);
      toast.success('Kampagne erfolgreich gelöscht');
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Fehler beim Löschen der Kampagne');
    }
  };

  const handleToggleStatus = async (id: string, active: boolean) => {
    try {
      await CampaignService.toggleCampaignStatus(id, active);
      toast.success(`Kampagne ${active ? 'aktiviert' : 'deaktiviert'}`);
      loadCampaigns();
    } catch (error) {
      console.error('Error toggling campaign status:', error);
      toast.error('Fehler beim Ändern des Kampagnenstatus');
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      description: campaign.description,
      code: campaign.code,
      discount_percentage: campaign.discount_percentage,
      active: campaign.active ?? true,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      priority: campaign.priority ?? 0,
      display_type: campaign.display_type ?? 'banner'
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingCampaign(null);
    setFormData({
      title: '',
      description: '',
      code: '',
      discount_percentage: null,
      active: true,
      start_date: null,
      end_date: null,
      priority: 0,
      display_type: 'banner'
    });
  };

  const isActive = (campaign: Campaign) => {
    if (!campaign.active) return false;
    const now = new Date();
    const start = campaign.start_date ? new Date(campaign.start_date) : null;
    const end = campaign.end_date ? new Date(campaign.end_date) : null;
    
    if (start && now < start) return false;
    if (end && now > end) return false;
    
    return true;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Kampagnen-Verwaltung</CardTitle>
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Kampagne
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Kampagnen werden nur Nutzern ohne Premium-Abo angezeigt. Aktive Kampagnen mit höherer Priorität werden zuerst angezeigt.
          </AlertDescription>
        </Alert>

        {loading ? (
          <div>Lade Kampagnen...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Keine Kampagnen vorhanden. Erstelle deine erste Kampagne!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Rabatt</TableHead>
                  <TableHead>Priorität</TableHead>
                  <TableHead>Anzeigeart</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={campaign.active ?? false}
                          onCheckedChange={(checked) => handleToggleStatus(campaign.id, checked)}
                        />
                        {isActive(campaign) ? (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />
                            Inaktiv
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.title}</div>
                        <div className="text-sm text-muted-foreground">{campaign.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {campaign.code ? (
                        <Badge variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {campaign.code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.discount_percentage ? (
                        <Badge variant="secondary">{campaign.discount_percentage}%</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{campaign.priority ?? 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{campaign.display_type || 'banner'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {campaign.start_date && format(new Date(campaign.start_date), 'dd.MM.yyyy', { locale: de })}
                        {' - '}
                        {campaign.end_date ? format(new Date(campaign.end_date), 'dd.MM.yyyy', { locale: de }) : 'Unbegrenzt'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(campaign)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(campaign.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? 'Kampagne bearbeiten' : 'Neue Kampagne erstellen'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Titel</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Black Friday Special"
                />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="z.B. Jetzt 20% auf das Monatsabo sparen!"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rabattcode (optional)</Label>
                  <Input
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value || null })}
                    placeholder="z.B. BLACKFRIDAY20"
                  />
                </div>
                <div>
                  <Label>Rabatt in % (optional)</Label>
                  <Input
                    type="number"
                    value={formData.discount_percentage || ''}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="z.B. 20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Startdatum (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_date ? formData.start_date.slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                </div>
                <div>
                  <Label>Enddatum (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_date ? formData.end_date.slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priorität</Label>
                  <Input
                    type="number"
                    value={formData.priority || 0}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Anzeigeart</Label>
                  <Select 
                    value={formData.display_type || 'banner'} 
                    onValueChange={(value) => setFormData({ ...formData, display_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="modal">Modal</SelectItem>
                      <SelectItem value="toast">Toast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.active ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label>Kampagne aktiv</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit}>
                {editingCampaign ? 'Speichern' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CampaignManagement; 