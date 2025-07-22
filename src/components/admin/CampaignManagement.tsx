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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Edit, Trash2, Calendar, Tag, AlertCircle, Eye, EyeOff, 
  AlertTriangle, Info, MessageSquare, ExternalLink, Users, Crown
} from 'lucide-react';
import { CampaignService } from '@/services/CampaignService';
import { 
  EnhancedCampaign, 
  CampaignFormData, 
  CampaignType, 
  ActionType, 
  StylingVariant,
  CAMPAIGN_STYLING 
} from '@/types/Campaign';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const CampaignManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EnhancedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EnhancedCampaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    campaign_type: 'discount',
    show_to_premium: false,
    action_type: 'subscription',
    action_url: '',
    action_text: '',
    styling_variant: 'default',
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

      // Validation based on action type
      if ((formData.action_type === 'navigate' || formData.action_type === 'external_link') && !formData.action_url) {
        toast.error('URL ist für diese Aktion erforderlich');
        return;
      }

      if (editingCampaign) {
        await CampaignService.updateEnhancedCampaign(editingCampaign.id, formData);
        toast.success('Kampagne erfolgreich aktualisiert');
      } else {
        await CampaignService.createEnhancedCampaign(formData);
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

  const handleEdit = (campaign: EnhancedCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      description: campaign.description,
      campaign_type: (campaign.campaign_type as CampaignType) || 'discount',
      show_to_premium: campaign.show_to_premium || false,
      action_type: (campaign.action_type as ActionType) || 'subscription',
      action_url: campaign.action_url || '',
      action_text: campaign.action_text || '',
      styling_variant: (campaign.styling_variant as StylingVariant) || 'default',
      code: campaign.code || '',
      discount_percentage: campaign.discount_percentage,
      active: campaign.active ?? true,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      priority: campaign.priority ?? 0,
      display_type: (campaign.display_type as 'banner' | 'modal' | 'toast') || 'banner'
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingCampaign(null);
    setFormData({
      title: '',
      description: '',
      campaign_type: 'discount',
      show_to_premium: false,
      action_type: 'subscription',
      action_url: '',
      action_text: '',
      styling_variant: 'default',
      code: '',
      discount_percentage: null,
      active: true,
      start_date: null,
      end_date: null,
      priority: 0,
      display_type: 'banner'
    });
  };

  const isActive = (campaign: EnhancedCampaign) => {
    if (!campaign.active) return false;
    const now = new Date();
    const start = campaign.start_date ? new Date(campaign.start_date) : null;
    const end = campaign.end_date ? new Date(campaign.end_date) : null;
    
    if (start && now < start) return false;
    if (end && now > end) return false;
    
    return true;
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return AlertTriangle;
      case 'feedback': return MessageSquare;
      case 'announcement': return Info;
      case 'discount':
      default: return Tag;
    }
  };

  const getCampaignTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'maintenance': return 'destructive';
      case 'feedback': return 'secondary';
      case 'announcement': return 'outline';
      case 'discount':
      default: return 'default';
    }
  };

  const loadCampaignTemplate = (type: CampaignType) => {
    const templates: Record<CampaignType, Partial<CampaignFormData>> = {
      discount: {
        campaign_type: 'discount',
        action_type: 'subscription',
        styling_variant: 'default',
        title: 'Spezialangebot',
        description: 'Sichere dir jetzt einen Rabatt auf das Premium-Abo!',
        action_text: 'Jetzt sparen'
      },
      maintenance: {
        campaign_type: 'maintenance',
        action_type: 'dismiss_only',
        styling_variant: 'warning',
        show_to_premium: true,
        title: 'Wartungsarbeiten',
        description: 'Am [Datum] führen wir planmäßige Wartungsarbeiten durch.',
        action_text: 'Verstanden'
      },
      feedback: {
        campaign_type: 'feedback',
        action_type: 'feedback_form',
        styling_variant: 'info',
        show_to_premium: true,
        title: 'Dein Feedback ist wichtig',
        description: 'Hilf uns dabei, die Plattform zu verbessern!',
        action_text: 'Feedback geben'
      },
      announcement: {
        campaign_type: 'announcement',
        action_type: 'navigate',
        styling_variant: 'success',
        show_to_premium: true,
        title: 'Neue Funktionen verfügbar',
        description: 'Entdecke die neuesten Features unserer Plattform.',
        action_text: 'Mehr erfahren',
        action_url: '/changelog'
      }
    };

    setFormData({ ...formData, ...templates[type] });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Erweiterte Kampagnen-Verwaltung</CardTitle>
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
            Kampagnen können jetzt für alle Nutzertypen konfiguriert werden. Verschiedene Kampagnentypen 
            unterstützen Rabatte, Wartungsankündigungen, Feedback-Sammlung und allgemeine Benachrichtigungen.
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
                  <TableHead>Titel & Typ</TableHead>
                  <TableHead>Zielgruppe</TableHead>
                  <TableHead>Aktion</TableHead>
                  <TableHead>Styling</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const TypeIcon = getCampaignTypeIcon(campaign.campaign_type || 'discount');
                  return (
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
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4" />
                            <span className="font-medium">{campaign.title}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">{campaign.description}</div>
                          <Badge 
                            variant={getCampaignTypeBadgeVariant(campaign.campaign_type || 'discount')}
                            className="text-xs"
                          >
                            {campaign.campaign_type || 'discount'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {campaign.show_to_premium ? 'Alle Nutzer' : 'Nur Free-Nutzer'}
                          </span>
                          {campaign.show_to_premium && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs">
                            {campaign.action_type || 'subscription'}
                          </Badge>
                          {campaign.action_url && (
                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {campaign.action_url}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{
                            backgroundColor: CAMPAIGN_STYLING[campaign.styling_variant as StylingVariant || 'default'].badgeClass.includes('bg-blue') ? '#3b82f6' :
                              CAMPAIGN_STYLING[campaign.styling_variant as StylingVariant || 'default'].badgeClass.includes('bg-yellow') ? '#eab308' :
                              CAMPAIGN_STYLING[campaign.styling_variant as StylingVariant || 'default'].badgeClass.includes('bg-cyan') ? '#06b6d4' :
                              CAMPAIGN_STYLING[campaign.styling_variant as StylingVariant || 'default'].badgeClass.includes('bg-green') ? '#10b981' :
                              CAMPAIGN_STYLING[campaign.styling_variant as StylingVariant || 'default'].badgeClass.includes('bg-red') ? '#ef4444' : '#6b7280',
                            color: 'white'
                          }}
                        >
                          {campaign.styling_variant || 'default'}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {campaign.display_type || 'banner'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          <div className="text-xs">
                            {campaign.start_date && format(new Date(campaign.start_date), 'dd.MM.yy', { locale: de })}
                            {' - '}
                            {campaign.end_date ? format(new Date(campaign.end_date), 'dd.MM.yy', { locale: de }) : '∞'}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Priorität: {campaign.priority ?? 0}
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? 'Kampagne bearbeiten' : 'Neue Kampagne erstellen'}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Grundlagen</TabsTrigger>
                <TabsTrigger value="targeting">Zielgruppe</TabsTrigger>
                <TabsTrigger value="action">Aktion</TabsTrigger>
                <TabsTrigger value="styling">Design</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Wähle zunächst eine Vorlage für deinen Kampagnentyp oder erstelle eine benutzerdefinierte Kampagne.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kampagnen-Vorlagen</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['discount', 'maintenance', 'feedback', 'announcement'] as CampaignType[]).map((type) => {
                        const Icon = getCampaignTypeIcon(type);
                        return (
                          <Button
                            key={type}
                            variant="outline"
                            size="sm"
                            onClick={() => loadCampaignTemplate(type)}
                            className="flex items-center gap-2"
                          >
                            <Icon className="h-4 w-4" />
                            {type}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Titel</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="z.B. Black Friday Special"
                    />
                  </div>
                  <div>
                    <Label>Kampagnentyp</Label>
                    <Select 
                      value={formData.campaign_type} 
                      onValueChange={(value: CampaignType) => setFormData({ ...formData, campaign_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Rabatt/Angebot</SelectItem>
                        <SelectItem value="maintenance">Wartung/System</SelectItem>
                        <SelectItem value="feedback">Feedback sammeln</SelectItem>
                        <SelectItem value="announcement">Ankündigung</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                
                {formData.campaign_type === 'discount' && (
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
                )}
              </TabsContent>
              
              <TabsContent value="targeting" className="space-y-4">
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    Bestimme, welche Nutzergruppen diese Kampagne sehen sollen.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.show_to_premium}
                      onCheckedChange={(checked) => setFormData({ ...formData, show_to_premium: checked })}
                    />
                    <Label className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Auch Premium-Nutzern anzeigen
                    </Label>
                  </div>
                  
                  <Alert>
                    <AlertDescription>
                      {formData.show_to_premium 
                        ? "Diese Kampagne wird allen Nutzern angezeigt (Free + Premium)."
                        : "Diese Kampagne wird nur kostenlosen Nutzern angezeigt."
                      }
                    </AlertDescription>
                  </Alert>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priorität</Label>
                    <Input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Höhere Werte werden zuerst angezeigt
                    </p>
                  </div>
                  <div>
                    <Label>Anzeigeart</Label>
                    <Select 
                      value={formData.display_type} 
                      onValueChange={(value: 'banner' | 'modal' | 'toast') => setFormData({ ...formData, display_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banner">Banner (oben auf der Seite)</SelectItem>
                        <SelectItem value="modal">Modal (Popup-Fenster)</SelectItem>
                        <SelectItem value="toast">Toast (Benachrichtigung)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="action" className="space-y-4">
                <Alert>
                  <ExternalLink className="h-4 w-4" />
                  <AlertDescription>
                    Konfiguriere, was passiert, wenn Nutzer auf die Kampagne klicken.
                  </AlertDescription>
                </Alert>
                
                <div>
                  <Label>Aktionstyp</Label>
                  <Select 
                    value={formData.action_type} 
                    onValueChange={(value: ActionType) => setFormData({ ...formData, action_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">Zur Abo-Seite</SelectItem>
                      <SelectItem value="navigate">Interne Navigation</SelectItem>
                      <SelectItem value="external_link">Externen Link öffnen</SelectItem>
                      <SelectItem value="feedback_form">Feedback-Formular</SelectItem>
                      <SelectItem value="dismiss_only">Nur Schließen-Button</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(formData.action_type === 'navigate' || formData.action_type === 'external_link') && (
                  <div>
                    <Label>
                      {formData.action_type === 'navigate' ? 'Interner Pfad' : 'Externe URL'}
                    </Label>
                    <Input
                      value={formData.action_url || ''}
                      onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                      placeholder={formData.action_type === 'navigate' ? '/dashboard' : 'https://example.com'}
                    />
                  </div>
                )}
                
                <div>
                  <Label>Button-Text (optional)</Label>
                  <Input
                    value={formData.action_text || ''}
                    onChange={(e) => setFormData({ ...formData, action_text: e.target.value })}
                    placeholder="Wird automatisch basierend auf Aktionstyp gesetzt"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="styling" className="space-y-4">
                <Alert>
                  <Tag className="h-4 w-4" />
                  <AlertDescription>
                    Wähle das visuelle Design für deine Kampagne.
                  </AlertDescription>
                </Alert>
                
                <div>
                  <Label>Design-Variante</Label>
                  <Select 
                    value={formData.styling_variant} 
                    onValueChange={(value: StylingVariant) => setFormData({ ...formData, styling_variant: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Standard (Blau) - für Rabatte</SelectItem>
                      <SelectItem value="warning">Warnung (Gelb) - für Wartungen</SelectItem>
                      <SelectItem value="info">Info (Cyan) - für Ankündigungen</SelectItem>
                      <SelectItem value="success">Erfolg (Grün) - für positive Nachrichten</SelectItem>
                      <SelectItem value="error">Fehler (Rot) - für kritische Hinweise</SelectItem>
                    </SelectContent>
                  </Select>
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
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label>Kampagne aktivieren</Label>
                </div>
                
                {/* Preview Section */}
                <div className="mt-6 p-4 border rounded-lg">
                  <Label className="text-sm font-medium">Vorschau:</Label>
                  <div className={`mt-2 p-3 rounded-md ${CAMPAIGN_STYLING[formData.styling_variant].containerClass} border`}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formData.title || 'Titel'}</span>
                      <span>{formData.description || 'Beschreibung'}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
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