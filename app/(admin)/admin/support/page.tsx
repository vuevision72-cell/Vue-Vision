
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Download, MoreHorizontal, User, Home, Phone, ShoppingBag, Calendar, Info, MessageSquare, FileText } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';


type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

interface SupportRequest {
    id: number;
    created_at: string;
    order_id: number;
    order_item_id: number;
    reason: string;
    request_type: 'Refund' | 'Replacement';
    video_url: string | null;
    user_id: string;
    status: RequestStatus;
    admin_notes: string | null;
    customer_name?: string;
}

interface Order {
    id: number;
    created_at: string;
    total: number;
    status: string;
    shipping_address: any;
    order_items: any[];
    refunded_amount: number;
}


export default function AdminSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [isActionDialog, setIsActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'Approve' | 'Reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState<number | string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDialog, setIsOrderDialog] = useState(false);
  const [isOrderLoading, setIsOrderLoading] = useState(false);
  const [isReasonDialog, setIsReasonDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');


  const { toast } = useToast();

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('customer_support_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: "Could not fetch support requests." });
        console.error("Error fetching requests:", error);
    } else {
        const requestsWithNames = await Promise.all(
            (data || []).map(async (req) => {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', req.user_id)
                    .single();
                
                return {
                    ...req,
                    customer_name: profileData?.full_name || 'N/A'
                }
            })
        );
        setRequests(requestsWithNames as SupportRequest[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenActionDialog = (request: SupportRequest, type: 'Approve' | 'Reject') => {
      setSelectedRequest(request);
      setActionType(type);
      setAdminNotes(request.admin_notes || '');
      setRefundAmount('');
      setIsActionDialog(true);
  }

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !actionType) return;

    const newStatus = actionType === 'Approve' ? 'Approved' : 'Rejected';
    
    // Handle refund logic
    if (actionType === 'Approve' && selectedRequest.request_type === 'Refund') {
        const amountToRefund = Number(refundAmount);
        if (isNaN(amountToRefund) || amountToRefund <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid refund amount.'});
            return;
        }

        // Fetch the current order to get existing refunded amount
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('refunded_amount')
            .eq('id', selectedRequest.order_id)
            .single();

        if (orderError) {
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not fetch original order.'});
            return;
        }
        
        const newTotalRefunded = (orderData.refunded_amount || 0) + amountToRefund;

        const { error: updateOrderError } = await supabase
            .from('orders')
            .update({ refunded_amount: newTotalRefunded })
            .eq('id', selectedRequest.order_id);

        if (updateOrderError) {
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update order with refund amount.'});
            return;
        }
    }

    const { error: updateRequestError } = await supabase
        .from('customer_support_requests')
        .update({ status: newStatus, admin_notes: adminNotes })
        .eq('id', selectedRequest.id);

    if (updateRequestError) {
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update request status.'});
    } else {
        toast({ title: 'Success', description: `Request status updated to ${newStatus}.`});
        fetchRequests(); // Refresh the data
    }
    setIsActionDialog(false);
    setSelectedRequest(null);
    setAdminNotes('');
    setRefundAmount('');
  }
  
  const handleViewOrder = async (orderId: number) => {
    setIsOrderLoading(true);
    setIsOrderDialog(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();
    
    if (error || !data) {
        toast({ variant: 'destructive', title: 'Error', description: "Could not fetch order details." });
        setIsOrderDialog(false);
    } else {
        setSelectedOrder(data as Order);
    }
    setIsOrderLoading(false);
  }

  const handleViewReason = (reason: string) => {
    setSelectedReason(reason);
    setIsReasonDialog(true);
  }


  const getStatusBadgeVariant = (status: RequestStatus) => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Pending': return 'secondary';
        case 'Rejected': return 'destructive';
        default: return 'outline';
    }
  }

    const ActionsMenu = ({ req }: { req: SupportRequest }) => (
        <div className="flex items-center gap-2 mt-4 md:mt-0">
            {req.video_url && (
                <Button asChild variant="outline" size="sm">
                    <Link href={req.video_url} target="_blank">
                        <Download className="h-3 w-3 mr-1"/> Video
                    </Link>
                </Button>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => handleOpenActionDialog(req, 'Approve')} disabled={req.status === 'Approved'}>
                        Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleOpenActionDialog(req, 'Reject')} disabled={req.status === 'Rejected'}>
                        Reject
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );


  return (
    <div className="space-y-8">
        <h1 className="font-headline text-3xl">Support Requests</h1>
        
        <Card>
            <CardHeader>
                <CardTitle>Customer Support Requests</CardTitle>
                <CardDescription>
                Manage and process customer issues related to orders.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>User Prefers</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                </TableRow>
                            ))
                        )}
                        {!isLoading && requests?.map((req) => (
                        <TableRow key={req.id}>
                            <TableCell className="font-medium text-xs text-muted-foreground">#{req.id.toString()}</TableCell>
                            <TableCell>{req.customer_name || 'N/A'}</TableCell>
                            <TableCell>
                                <Button variant="link" className="p-0 h-auto" onClick={() => handleViewOrder(req.order_id)}>
                                    #{req.order_id}
                                </Button>
                            </TableCell>
                            <TableCell>
                                <Button variant="link" className="p-0 h-auto text-left" onClick={() => handleViewReason(req.reason)}>
                                    <span className="max-w-[150px] truncate">{req.reason}</span>
                                </Button>
                            </TableCell>
                            <TableCell><Badge variant="outline">{req.request_type}</Badge></TableCell>
                            <TableCell><Badge variant={getStatusBadgeVariant(req.status)}>{req.status}</Badge></TableCell>
                            <TableCell>
                                <ActionsMenu req={req} />
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                
                {/* Mobile Accordion View */}
                <div className="md:hidden">
                    <Accordion type="single" collapsible>
                        {isLoading && Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-16 w-full my-2"/>)}
                        {!isLoading && requests?.map(req => (
                            <AccordionItem value={req.id.toString()} key={req.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between items-center w-full pr-4">
                                        <div className="text-left">
                                            <p className="font-semibold">#{req.id} - {req.customer_name || 'N/A'}</p>
                                            <p className="text-sm text-muted-foreground">Order #{req.order_id}</p>
                                        </div>
                                        <Badge variant={getStatusBadgeVariant(req.status)}>{req.status}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 space-y-4 bg-secondary/50 rounded-b-md">
                                    <div>
                                        <p className="font-semibold">Reason:</p>
                                        <p className="text-sm text-muted-foreground truncate">{req.reason}</p>
                                        <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handleViewReason(req.reason)}>View Full Reason</Button>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleViewOrder(req.order_id)}>View Order Details</Button>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">Request Type:</p>
                                            <Badge variant="outline">{req.request_type}</Badge>
                                        </div>
                                        <ActionsMenu req={req} />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                {!isLoading && (!requests || requests.length === 0) && (
                    <div className="text-center h-24 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                        No support requests found.
                    </div>
                )}
            </CardContent>
        </Card>

         <Dialog open={isActionDialog} onOpenChange={setIsActionDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {actionType} Request #{selectedRequest?.id.toString()}
                    </DialogTitle>
                    <DialogDescription>
                        {actionType === 'Approve' && selectedRequest?.request_type === 'Refund'
                            ? 'Enter the amount to refund and any internal notes.'
                            : "Add any notes for this action. This will be saved for your records."
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {actionType === 'Approve' && selectedRequest?.request_type === 'Refund' && (
                        <div className="space-y-2">
                            <Label htmlFor="refund-amount">Refund Amount (₹)</Label>
                            <Input
                                id="refund-amount"
                                type="number"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                                placeholder="e.g., 500.00"
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="admin-notes">Notes</Label>
                        <Textarea 
                            id="admin-notes"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="e.g. Refund processed via GPay, replacement shipped, etc."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsActionDialog(false)}>Cancel</Button>
                    <Button onClick={handleStatusUpdate}>
                        Confirm {actionType}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isOrderDialog} onOpenChange={setIsOrderDialog}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                </DialogHeader>
                {isOrderLoading && <Skeleton className="h-64 w-full" />}
                {!isOrderLoading && selectedOrder && (
                     <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="space-y-1"><div className="text-muted-foreground flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> Order ID</div><div className="font-medium">#{selectedOrder.id}</div></div>
                            <div className="space-y-1"><div className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</div><div className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</div></div>
                            <div className="space-y-1"><div className="text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" /> Status</div><div><Badge>{selectedOrder.status}</Badge></div></div>
                            <div className="space-y-1"><div className="text-muted-foreground">Total</div><div className="font-medium">₹{selectedOrder.total.toFixed(2)}</div></div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {selectedOrder.shipping_address && (
                                <Card className="p-4">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2"><Home className="h-4 w-4"/> Shipping Details</h4>
                                    <address className="not-italic text-sm space-y-1">
                                        <p className="font-medium">{selectedOrder.shipping_address.first_name} {selectedOrder.shipping_address.last_name}</p>
                                        <p>{selectedOrder.shipping_address.address}</p>
                                        <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.postal_code}</p>
                                        <p>{selectedOrder.shipping_address.country}</p>
                                    </address>
                                    <div className="mt-3 pt-3 border-t">
                                        <h5 className="font-semibold mb-2 flex items-center gap-2"><User className="h-4 w-4"/> Contact</h5>
                                        <div className="text-sm space-y-1">
                                            {selectedOrder.shipping_address.phone_number && <p className="flex items-center gap-2"><Phone className="h-3 w-3"/>{selectedOrder.shipping_address.phone_number}</p>}
                                        </div>
                                    </div>
                                </Card>
                            )}
                             <Card className="p-4">
                                <h4 className="font-semibold mb-2">Order Items</h4>
                                <div className="space-y-2">
                                {selectedOrder.order_items.map(item => (
                                    <div key={item.id} className="text-sm p-2 border rounded-md bg-secondary/50">
                                        <p><strong>{item.product_type}</strong> (ID: {item.product_id})</p>
                                        <p>Qty: {item.quantity} @ ₹{item.price.toFixed(2)}</p>
                                    </div>
                                ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
        
        <Dialog open={isReasonDialog} onOpenChange={setIsReasonDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> Full Reason</DialogTitle>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedReason}</p>
                </div>
            </DialogContent>
        </Dialog>

    </div>
  );
}
