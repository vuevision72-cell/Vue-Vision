

'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Upload, Download, CheckCircle, HelpCircle, MessageSquare, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

type OrderStatus = 'Processing' | 'Bagged' | 'Shipped' | 'Delivered to Nearest Hub' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Pending Payment';
type SupportRequestStatus = 'Pending' | 'Approved' | 'Rejected';


interface SupportRequest {
    id: string;
    status: SupportRequestStatus;
    order_item_id: number;
    request_type: 'Refund' | 'Replacement';
}

interface OrderItem {
    id: number;
    product_type: string;
    quantity: number;
    price: number;
    lens_config: any;
    product_id: string; 
}

interface Order {
  id: number;
  created_at: string;
  status: OrderStatus;
  total: number;
  order_items: OrderItem[];
  user_id: string;
}

const WhatsAppIcon = () => (
  <div className="relative h-5 w-5 inline-block ml-1 align-middle">
      <Image 
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
        alt="WhatsApp Icon"
        fill
        className="object-contain"
      />
  </div>
);

const LensConfigDetail = ({ label, value }: { label: string, value: any }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    return (
        <div className="flex justify-between text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium text-right">{Array.isArray(value) ? value.join(', ') : value}</dd>
        </div>
    );
};

export default function AccountOrdersPage() {
    const { profile, isLoading: isProfileLoading } = useUserProfile([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [contactInfo, setContactInfo] = useState({ phone_number: '' });
    
    const [returnStates, setReturnStates] = useState<{[itemId: number]: {reason: string, video: File | null, isSubmitting: boolean, requestType: 'Refund' | 'Replacement' | null}}>({});

    const handleReturnStateChange = (itemId: number, field: keyof typeof returnStates[0], value: any) => {
        setReturnStates(prev => ({
            ...prev,
            [itemId]: {
                ...(prev[itemId] || { reason: '', video: null, isSubmitting: false, requestType: null }),
                [field]: value
            }
        }));
    };

    const fetchInitialData = async () => {
        setIsLoading(true);
        const fetchContactInfo = supabase.from('contact_info').select('phone_number').eq('id', 1).single();

        const [contactResult] = await Promise.all([fetchContactInfo]);
        
        if (contactResult.data) {
            setContactInfo(contactResult.data);
        }

        if (profile?.id) {
            await fetchOrdersAndRequests();
        } else if (!isProfileLoading) {
            setIsLoading(false);
        }
    }

    const fetchOrdersAndRequests = async () => {
        if (!profile?.id) return;
        
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });

        if (orderError) {
            console.error("Error fetching orders:", orderError);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your orders.' });
            setIsLoading(false);
            return;
        } 
        
        const { data: requestData, error: requestError } = await supabase
            .from('customer_support_requests')
            .select('id, status, order_item_id, request_type')
            .eq('user_id', profile.id);
        
        if (requestError) {
            console.error("Error fetching support requests:", requestError);
        } else {
            setSupportRequests(requestData as SupportRequest[]);
        }

        setOrders(orderData as Order[]);
        const initialReturnStates: typeof returnStates = {};
        orderData.forEach(order => {
            order.order_items.forEach(item => {
                initialReturnStates[item.id] = { reason: '', video: null, isSubmitting: false, requestType: null };
            });
        });
        setReturnStates(initialReturnStates);
        
        setIsLoading(false);
    }

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (profile?.id) {
            fetchOrdersAndRequests();
        }
    }, [profile?.id])
    
    const getStatusBadgeVariant = (status: OrderStatus) => {
        switch (status) {
            case 'Delivered': return 'default';
            case 'Processing':
            case 'Bagged':
            case 'Shipped':
            case 'Delivered to Nearest Hub':
            case 'Out for Delivery': return 'secondary';
            case 'Cancelled': return 'destructive';
            case 'Pending Payment': return 'outline';
            default: return 'outline';
        }
    }

     const getSupportStatusBadgeVariant = (status: SupportRequestStatus) => {
        switch (status) {
            case 'Approved': return 'default';
            case 'Pending': return 'secondary';
            case 'Rejected': return 'destructive';
            default: return 'outline';
        }
    }
    
    const handleReturnRequest = async (orderId: number, orderItemId: number) => {
        const returnState = returnStates[orderItemId];
        if (!profile || !returnState.reason || !returnState.requestType) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a reason and select a request type.'});
            return;
        }
        
        handleReturnStateChange(orderItemId, 'isSubmitting', true);

        let videoUrl: string | null = null;
        if (returnState.video) {
            const filePath = `returns/${profile.id}/${Date.now()}_${returnState.video.name}`;
            const { error: uploadError } = await supabase.storage.from('public_uploads').upload(filePath, returnState.video);
            if (uploadError) {
                toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload your video file.'});
                handleReturnStateChange(orderItemId, 'isSubmitting', false);
                return;
            }
            const { data: { publicUrl } } = supabase.storage.from('public_uploads').getPublicUrl(filePath);
            videoUrl = publicUrl;
        }

        const { error } = await supabase.from('customer_support_requests').insert({
            order_id: orderId,
            order_item_id: orderItemId,
            request_type: returnState.requestType,
            reason: returnState.reason,
            video_url: videoUrl,
            user_id: profile.id,
        });
        
        if (error) {
           console.error("Return request error:", error);
           toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your support request. Please try again.' });
        } else {
           toast({ title: 'Success', description: 'Your support request has been submitted. We will get back to you shortly.'});
           await fetchOrdersAndRequests();
        }

        handleReturnStateChange(orderItemId, 'isSubmitting', false);
    }
    
    const whatsappLink = `https://wa.me/${contactInfo.phone_number?.replace(/\D/g, '')}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-3xl">My Orders</CardTitle>
        <CardDescription>
          View your complete order history.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
            {(isLoading || isProfileLoading) && Array.from({length: 3}).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full"/>
            ))}

            {!isLoading && !isProfileLoading && orders.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <p className="text-lg font-medium text-muted-foreground">You haven't placed any orders yet.</p>
                </div>
            )}
            
            {!isLoading && !isProfileLoading && orders.map((order) => (
                 <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="bg-secondary/50">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 md:gap-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                                <div>
                                    <div className="text-xs text-muted-foreground">Order ID</div>
                                    <div className="font-medium">#{order.id}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Date</div>
                                    <div className="font-medium">{new Date(order.created_at).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Total</div>
                                    <div className="font-medium">₹{order.total.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Status</div>
                                    <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <h4 className="font-semibold">Order Items</h4>
                            {order.order_items.map(item => {
                                const existingRequest = supportRequests.find(r => r.order_item_id === item.id);
                                return (
                                <div key={item.id} className="p-3 border rounded-md bg-background">
                                    <p><strong>Product ID:</strong> {item.product_id} ({item.product_type})</p>
                                    <p><strong>Quantity:</strong> {item.quantity}</p>
                                    <p><strong>Price:</strong> ₹{item.price.toFixed(2)}</p>
                                    {item.lens_config && (
                                        <div className="mt-2 text-xs text-muted-foreground p-3 bg-secondary rounded-md">
                                            <h5 className="font-semibold text-foreground mb-2">Lens Configuration:</h5>
                                            <dl className="space-y-1">
                                                {item.lens_config?.prescription_details?.type === 'whatsapp' && (
                                                    <div className="flex justify-between items-center text-sm font-bold text-yellow-700">
                                                        <dt className="flex items-center gap-1"><AlertCircle className="h-4 w-4"/> Prescription</dt>
                                                        <dd>
                                                            <Button variant="link" size="sm" asChild className="h-auto p-0 text-yellow-700">
                                                                <Link href={`${whatsappLink}?text=Hi, I'm submitting my prescription for Order #${order.id}, Item #${item.id}`} target="_blank">
                                                                    Submit on WhatsApp <WhatsAppIcon />
                                                                </Link>
                                                            </Button>
                                                        </dd>
                                                    </div>
                                                )}
                                                <LensConfigDetail label="Lens Type" value={item.lens_config.type} />
                                                <LensConfigDetail label="Package" value={item.lens_config.package} />
                                                <LensConfigDetail label="Add-ons" value={item.lens_config.addons} />
                                                <LensConfigDetail label="Tint Color" value={item.lens_config.tintColor || item.lens_config.color} />
                                                <LensConfigDetail label="Power" value={item.lens_config.power} />
                                                
                                                {item.lens_config.type === 'contact_lenses' && item.lens_config.boxes && (
                                                    <>
                                                        <LensConfigDetail label="Right Eye (OD) Boxes" value={item.lens_config.boxes.od} />
                                                        <LensConfigDetail label="Left Eye (OS) Boxes" value={item.lens_config.boxes.os} />
                                                    </>
                                                )}
                                                
                                                {item.lens_config.prescription?.od && (
                                                    <div className='text-xs pt-2 mt-2 border-t'>
                                                        <p className='font-bold text-foreground'>Right Eye (OD):</p>
                                                        <p>SPH: {item.lens_config.prescription.od.sph}, CYL: {item.lens_config.prescription.od.cyl}, Axis: {item.lens_config.prescription.od.axis}, AP: {item.lens_config.prescription.od.ap}</p>
                                                    </div>
                                                )}
                                                {item.lens_config.prescription?.os && (
                                                    <div className='text-xs pt-1'>
                                                        <p className='font-bold text-foreground'>Left Eye (OS):</p>
                                                        <p>SPH: {item.lens_config.prescription.os.sph}, CYL: {item.lens_config.prescription.os.cyl}, Axis: {item.lens_config.prescription.os.axis}, AP: {item.lens_config.prescription.os.ap}</p>
                                                    </div>
                                                )}


                                                {item.lens_config.customColorUrl && (
                                                    <div className="flex justify-between items-center text-sm">
                                                        <dt className="text-muted-foreground">Custom Color</dt>
                                                        <dd>
                                                            <Button variant="link" size="sm" asChild className="h-auto p-0">
                                                                <Link href={item.lens_config.customColorUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                                    View Upload <Download className="h-3 w-3" />
                                                                </Link>
                                                            </Button>
                                                        </dd>
                                                    </div>
                                                )}

                                                {(item.lens_config.prescriptionUrl || item.lens_config.prescription_details?.url) && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <dt className="text-muted-foreground">Prescription</dt>
                                                    <dd>
                                                    <Button variant="link" size="sm" asChild className="h-auto p-0">
                                                        <Link href={item.lens_config.prescriptionUrl || item.lens_config.prescription_details.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                        View Upload <Download className="h-3 w-3" />
                                                        </Link>
                                                    </Button>
                                                    </dd>
                                                </div>
                                                )}
                                            </dl>
                                        </div>
                                    )}
                                    {existingRequest ? (
                                        <div className="mt-4 p-3 bg-secondary rounded-md">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold flex items-center gap-2"><HelpCircle className="h-4 w-4"/> Support Request Submitted</p>
                                                    {existingRequest.status === 'Approved' && existingRequest.request_type === 'Replacement' && (
                                                        <div className="mt-2 text-sm text-foreground border-l-2 border-primary pl-3">
                                                            <p>Your replacement is approved. Please contact us for details on pickup and delivery.</p>
                                                            <Button asChild variant="link" className="p-0 h-auto text-primary">
                                                                <Link href={`${whatsappLink}?text=Hi,%20I%20have%20a%20question%20about%20my%20replacement%20for%20Order%20ID%20${order.id}`} target="_blank">
                                                                    <MessageSquare className="h-4 w-4 mr-2" /> Contact on WhatsApp
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge variant={getSupportStatusBadgeVariant(existingRequest.status)}>{existingRequest.status}</Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        <Accordion type="single" collapsible className="w-full mt-4">
                                            <AccordionItem value="return">
                                                <AccordionTrigger>Need Help?</AccordionTrigger>
                                                <AccordionContent className="space-y-4">
                                                    <Alert variant="destructive">
                                                        <AlertTitle>Unboxing Video</AlertTitle>
                                                        <AlertDescription>An unboxing video is mandatory for all return/refund requests for damaged items.</AlertDescription>
                                                    </Alert>
                                                    <div>
                                                        <Label>I would like a...</Label>
                                                        <RadioGroup onValueChange={(val) => handleReturnStateChange(item.id, 'requestType', val)} className="flex gap-4 mt-2">
                                                            <Label htmlFor={`refund-${item.id}`} className="flex items-center space-x-2 border rounded-md p-3 flex-1 cursor-pointer hover:bg-accent"><RadioGroupItem value="Refund" id={`refund-${item.id}`} /><span>Refund</span></Label>
                                                            <Label htmlFor={`replacement-${item.id}`} className="flex items-center space-x-2 border rounded-md p-3 flex-1 cursor-pointer hover:bg-accent"><RadioGroupItem value="Replacement" id={`replacement-${item.id}`} /><span>Replacement</span></Label>
                                                        </RadioGroup>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`reason-${item.id}`}>Reason</Label>
                                                        <Textarea id={`reason-${item.id}`} value={returnStates[item.id]?.reason || ''} onChange={(e) => handleReturnStateChange(item.id, 'reason', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`video-${item.id}`}>Upload Unboxing Video (optional)</Label>
                                                        <Input id={`video-${item.id}`} type="file" onChange={(e) => handleReturnStateChange(item.id, 'video', e.target.files ? e.target.files[0] : null)} />
                                                    </div>
                                                    <Button onClick={() => handleReturnRequest(order.id, item.id)} disabled={returnStates[item.id]?.isSubmitting || !returnStates[item.id]?.reason || !returnStates[item.id]?.requestType}>
                                                        {returnStates[item.id]?.isSubmitting && <Loader2 className="animate-spin mr-2" />}
                                                        Submit Request
                                                    </Button>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    )}
                                </div>
                                )
                            })}
                        </div>
                    </CardContent>
                 </Card>
            ))}
      </CardContent>
    </Card>
  );
}


    
